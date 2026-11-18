import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Customer } from './customer.entity.js';
import { SalesRep } from './sales-rep.entity.js';

export enum InventoryPolicy {
  Strict = 'strict',
  Flexible = 'flexible',
}

@Entity()
@Index(['customerId', 'createdAt'])
@Index(['salesRepId', 'createdAt'])
export class OrderRequest {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'uuid', unique: true })
  idempotencyKey: string;

  // Hash of the validated body, to detect a key reused with a different body.
  @Column({ type: 'text' })
  requestHash: string;

  @ManyToOne(() => Customer, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer: Relation<Customer>;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => SalesRep, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sales_rep_id' })
  salesRep: Relation<SalesRep>;

  @Column({ type: 'uuid' })
  salesRepId: string;

  @Column({ type: 'varchar' })
  contactName: string;

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ type: 'text', default: '' })
  notes: string;

  // The policy in force when the request was saved.
  @Column({
    type: 'enum',
    enum: InventoryPolicy,
    enumName: 'inventory_policy',
  })
  inventoryPolicy: InventoryPolicy;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
