import { Check, Column, Entity, PrimaryColumn } from 'typeorm';
import { InventoryPolicy } from './order-request.entity.js';

// Single-row table: the primary key is always true, so a second row cannot exist.
@Entity()
@Check('CHK_settings_single_row', '"id" = true')
export class Settings {
  @PrimaryColumn({ type: 'boolean', default: true })
  id: boolean;

  @Column({
    type: 'enum',
    enum: InventoryPolicy,
    enumName: 'inventory_policy',
  })
  inventoryPolicy: InventoryPolicy;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
