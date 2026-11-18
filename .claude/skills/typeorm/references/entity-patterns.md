# Entity patterns

## Base entity

```typescript
import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class TimestampedEntity {
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

Abstract, no `@Entity()`. It only shares columns. Do not use TypeORM's `BaseEntity` (Active Record methods hide the data access).

## Relations

```typescript
@Entity()
export class Order extends TimestampedEntity {
  @ManyToOne(() => Customer, (customer) => customer.orders, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn()
  customer: Customer;

  @Column()
  @Index()
  customerId: string;

  @OneToMany(() => OrderLine, (line) => line.order, { cascade: ['insert'] })
  lines: OrderLine[];
}
```

- Declare the foreign key column (`customerId`) next to the relation and index it.
- Choose `onDelete` on purpose: `RESTRICT` for business records (orders), `CASCADE` only for rows that make no sense alone (order lines).
- Prefer explicit loading (`relations`, query builder joins) over `eager: true`.

## Indexes and uniqueness

- Unique business rules live in the database (`@Index({ unique: true })`, composite with `@Index(['a', 'b'], { unique: true })`), not only in code. Catch the unique violation (Postgres code `23505`) and map it to a domain error.
- An idempotency key is its own table with a unique key column, written in the same transaction as the thing it protects.

## Enums

```typescript
export enum OrderStatus { Draft = 'draft', Confirmed = 'confirmed', Cancelled = 'cancelled' }

@Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Draft })
status: OrderStatus;
```

Adding a value is a migration. Share the enum values with the web app through `packages/contracts`, not by importing the entity.

## Numbers

Use `numeric` with a transformer or integer minor units for money. A `numeric` column returns a string from the driver: convert it at the boundary.

## Nullable columns

```typescript
@Column({ type: 'varchar', nullable: true })
notes: string | null;
```

Always set `type` explicitly when the TypeScript type is a union with `null`.
