import { Check, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
@Check('CHK_wine_available_non_negative', '"available" >= 0')
export class Wine {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  producer: string;

  // Null for non-vintage wines.
  @Column({ type: 'integer', nullable: true })
  vintage: number | null;

  // Free text such as "750 ml" or "1.5 L".
  @Column({ type: 'varchar' })
  format: string;

  @Column({ type: 'varchar', unique: true })
  sku: string;

  @Column({ type: 'integer' })
  available: number;
}
