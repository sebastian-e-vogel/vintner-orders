import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  checkStock,
  type OrderRequest as OrderRequestBody,
  type SaveOrderRequestRejected,
  type SaveOrderRequestResponse,
  type SavedRequestCount,
  type SavedRequestListItem,
} from '@vintner/contracts';
import { createHash } from 'node:crypto';
import { DataSource, In, Repository } from 'typeorm';
import { OrderRequest, OrderRequestItem } from '../database/entities/index.js';
import { InventoryPolicy } from '../database/entities/order-request.entity.js';
import { CustomersService } from '../customers/customers.service.js';
import { SalesRepsService } from '../sales-reps/sales-reps.service.js';
import { WinesService } from '../wines/wines.service.js';
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
    @InjectRepository(OrderRequest)
    private readonly orderRequests: Repository<OrderRequest>,
    @InjectRepository(OrderRequestItem)
    private readonly orderRequestItems: Repository<OrderRequestItem>,
    private readonly inventoryPolicy: InventoryPolicyService,
    private readonly customers: CustomersService,
    private readonly wines: WinesService,
    private readonly salesReps: SalesRepsService,
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
      if (!(await this.customers.exists(customerId, manager))) {
        throw reject({ reason: 'unknown_customer' });
      }

      const wineIds = body.lines.map((line) => line.wineId);
      const availableByWineId = await this.wines.findAvailability(
        wineIds,
        manager,
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
        salesRepId: (await this.salesReps.getCurrent(manager)).id,
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

  // Two queries however many requests: requests with customer and sales rep,
  // then their lines with the wine. Reads through the entity relations, so no
  // other module's logic is repeated.
  async list(): Promise<SavedRequestListItem[]> {
    const requests = await this.orderRequests.find({
      relations: { customer: true, salesRep: true },
      order: { createdAt: 'DESC', id: 'ASC' },
    });
    if (requests.length === 0) return [];

    const items = await this.orderRequestItems.find({
      where: { requestId: In(requests.map((request) => request.id)) },
      relations: { wine: true },
      order: { wine: { name: 'ASC', id: 'ASC' } },
    });
    const itemsByRequest = new Map<string, OrderRequestItem[]>();
    for (const item of items) {
      itemsByRequest.set(item.requestId, [
        ...(itemsByRequest.get(item.requestId) ?? []),
        item,
      ]);
    }

    return requests.map((request) => ({
      id: request.id,
      createdAt: request.createdAt.toISOString(),
      policy: request.inventoryPolicy,
      contactName: request.contactName,
      phone: request.phone,
      notes: request.notes,
      salesRepName: request.salesRep.name,
      customer: {
        name: request.customer.name,
        contactName: request.customer.contactName,
      },
      lines: (itemsByRequest.get(request.id) ?? []).map((item) => ({
        wine: {
          id: item.wine.id,
          name: item.wine.name,
          producer: item.wine.producer,
          vintage: item.wine.vintage,
          format: item.wine.format,
          sku: item.wine.sku,
        },
        quantity: item.quantity,
        availableAtSave: item.availableAtSave,
        shortBy: Math.max(0, item.quantity - item.availableAtSave),
      })),
    }));
  }

  async count(): Promise<SavedRequestCount> {
    return { count: await this.orderRequests.count() };
  }
}
