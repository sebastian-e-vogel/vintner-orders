import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Customer } from './customer.entity.js';
import { SalesRep } from './sales-rep.entity.js';

@Entity()
@Index(['customerId', 'orderedAt'])
@Index(['salesRepId', 'orderedAt'])
export class HistoricalOrder {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

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

  @Column({ type: 'timestamptz' })
  orderedAt: Date;
}
