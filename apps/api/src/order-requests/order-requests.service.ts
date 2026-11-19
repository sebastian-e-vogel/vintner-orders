import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  checkStock,
  type OrderRequest as OrderRequestBody,
  type SaveOrderRequestRejected,
  type SaveOrderRequestResponse,
} from '@vintner/contracts';
import { createHash } from 'node:crypto';
import { DataSource, In, type EntityManager } from 'typeorm';
import {
  Customer,
  OrderRequest,
  OrderRequestItem,
  SalesRep,
  Wine,
} from '../database/entities/index.js';
import { InventoryPolicy } from '../database/entities/order-request.entity.js';
import { CURRENT_SALES_REP_ID } from '../sales-reps/current-sales-rep.js';
import { InventoryPolicyService } from '../settings/inventory-policy.service.js';

const reject = (body: SaveOrderRequestRejected) =>
  new UnprocessableEntityException(body);

// Hash of the validated body. Ids are lowercased and lines sorted, so only a
// real change of content gives a different hash.
const hashBody = (body: OrderRequestBody) =>
  createHash('sha256')
    .update(
      JSON.stringify({
        customerId: body.customerId.toLowerCase(),
        contactName: body.contactName,
        phone: body.phone,
        notes: body.notes,
        lines: body.lines
          .map(({ wineId, quantity }) => ({ wineId, quantity }))
          .sort((a, b) => a.wineId.localeCompare(b.wineId)),
      }),
    )
    .digest('hex');

type SavedItem = { wineId: string; quantity: number; availableAtSave: number };

const toResponse = (
  request: Pick<OrderRequest, 'id' | 'createdAt' | 'inventoryPolicy'>,
  items: SavedItem[],
  duplicate: boolean,
): SaveOrderRequestResponse => ({
  id: request.id,
  createdAt: request.createdAt.toISOString(),
  policy: request.inventoryPolicy,
  lines: items
    .map(({ wineId, quantity, availableAtSave }) => ({
      wineId,
      quantity,
      available: availableAtSave,
      shortBy: Math.max(0, quantity - availableAtSave),
    }))
    .sort((a, b) => a.wineId.localeCompare(b.wineId)),
  duplicate,
});

@Injectable()
export class OrderRequestsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly inventoryPolicy: InventoryPolicyService,
  ) {}

  save(
    idempotencyKey: string,
    body: OrderRequestBody,
  ): Promise<SaveOrderRequestResponse> {
    const key = idempotencyKey.toLowerCase();
    const requestHash = hashBody(body);

    return this.dataSource.transaction(async (manager) => {
      // Same-key requests queue here, so the later one sees the committed row
      // and answers as a duplicate instead of hitting the unique index.
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [key],
      );

      const existing = await manager
        .getRepository(OrderRequest)
        .findOneBy({ idempotencyKey: key });
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw reject({ reason: 'idempotency_key_reused' });
        }
        const items = await manager
          .getRepository(OrderRequestItem)
          .findBy({ requestId: existing.id });
        return toResponse(existing, items, true);
      }

      const { policy } = await this.inventoryPolicy.get(
        manager,
        'pessimistic_read',
      );

      const customerId = body.customerId.toLowerCase();
      if (
        !(await manager.getRepository(Customer).existsBy({ id: customerId }))
      ) {
        throw reject({ reason: 'unknown_customer' });
      }

      const wineIds = body.lines.map((line) => line.wineId);
      const wines = await manager.getRepository(Wine).find({
        select: { id: true, available: true },
        where: { id: In(wineIds) },
      });
      const availableByWineId = Object.fromEntries(
        wines.map((wine) => [wine.id, wine.available]),
      );
      const unknown = wineIds.filter((id) => !(id in availableByWineId));
      if (unknown.length > 0) {
        throw reject({ reason: 'unknown_wines', wineIds: unknown });
      }

      const stock = checkStock(body.lines, availableByWineId, policy);
      if (!stock.canSave) {
        throw reject({ reason: 'over_stock', policy, lines: stock.lines });
      }

      const request = await manager.getRepository(OrderRequest).save({
        idempotencyKey: key,
        requestHash,
        customerId,
        salesRepId: await this.currentSalesRepId(manager),
        contactName: body.contactName,
        phone: body.phone,
        notes: body.notes,
        inventoryPolicy: policy as InventoryPolicy,
      });
      const items = stock.lines.map((line) => ({
        requestId: request.id,
        wineId: line.wineId,
        quantity: line.quantity,
        availableAtSave: line.available,
      }));
      await manager.insert(OrderRequestItem, items);
      return toResponse(request, items, false);
    });
  }

  private async currentSalesRepId(manager: EntityManager) {
    const exists = await manager
      .getRepository(SalesRep)
      .existsBy({ id: CURRENT_SALES_REP_ID });
    if (!exists) {
      throw new InternalServerErrorException(
        'The current sales rep does not exist. Run the seed.',
      );
    }
    return CURRENT_SALES_REP_ID;
  }
}
