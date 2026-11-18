import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { OrderRequest } from './order-request.entity.js';
import { Wine } from './wine.entity.js';

@Entity()
@Index(['requestId', 'wineId'], { unique: true })
@Check('CHK_order_request_item_quantity_positive', '"quantity" > 0')
export class OrderRequestItem {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => OrderRequest, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'request_id' })
  request: Relation<OrderRequest>;

  @Column({ type: 'uuid' })
  requestId: string;

  @ManyToOne(() => Wine, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'wine_id' })
  wine: Relation<Wine>;

  @Column({ type: 'uuid' })
  @Index()
  wineId: string;

  @Column({ type: 'integer' })
  quantity: number;

  // Stock available when the request was saved. Saving does not reserve stock.
  @Column({ type: 'integer' })
  availableAtSave: number;
}
