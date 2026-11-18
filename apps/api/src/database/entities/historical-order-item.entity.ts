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
import { HistoricalOrder } from './historical-order.entity.js';
import { Wine } from './wine.entity.js';

@Entity()
@Check('CHK_historical_order_item_quantity_positive', '"quantity" > 0')
export class HistoricalOrderItem {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => HistoricalOrder, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  order: Relation<HistoricalOrder>;

  @Column({ type: 'uuid' })
  @Index()
  orderId: string;

  @ManyToOne(() => Wine, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'wine_id' })
  wine: Relation<Wine>;

  @Column({ type: 'uuid' })
  @Index()
  wineId: string;

  @Column({ type: 'integer' })
  quantity: number;
}
