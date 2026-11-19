import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type {
  InventoryPolicyResponse,
  InventoryPolicy as PolicyValue,
} from '@vintner/contracts';
import { DataSource, type EntityManager } from 'typeorm';
import { Settings } from '../database/entities/index.js';

const missingRow = () =>
  new InternalServerErrorException(
    'Inventory policy is not configured: the settings row is missing. Run the seed.',
  );

@Injectable()
export class InventoryPolicyService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // Pass the manager of an open transaction to read inside it. With
  // 'pessimistic_read' (FOR SHARE, needs a transaction) set() waits until that
  // transaction ends, so the policy cannot change while the caller uses it.
  async get(
    manager: EntityManager = this.dataSource.manager,
    lock?: 'pessimistic_read',
  ): Promise<InventoryPolicyResponse> {
    const row = await manager.getRepository(Settings).findOne({
      where: { id: true },
      lock: lock && { mode: lock },
    });
    if (!row) throw missingRow();
    return toResponse(row.inventoryPolicy, row.updatedAt);
  }

  // One atomic UPDATE of the only row; it never inserts, so it cannot create a second one.
  async set(policy: PolicyValue): Promise<InventoryPolicyResponse> {
    const [rows] = (await this.dataSource.query(
      `UPDATE "settings" SET "inventory_policy" = $1, "updated_at" = now() WHERE "id" = true RETURNING "inventory_policy", "updated_at"`,
      [policy],
    )) as [{ inventory_policy: PolicyValue; updated_at: Date }[], number];
    const row = rows[0];
    if (!row) throw missingRow();
    return toResponse(row.inventory_policy, row.updated_at);
  }
}

const toResponse = (
  policy: PolicyValue,
  updatedAt: Date,
): InventoryPolicyResponse => ({ policy, updatedAt: updatedAt.toISOString() });
