import { Check, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
@Check('CHK_wine_available_non_negative', '"available" >= 0')
@Check('CHK_wine_size_ml_positive', '"size_ml" > 0')
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

  @Column({ type: 'varchar' })
  region: string;

  // Bottle size in millilitres.
  @Column({ type: 'integer' })
  sizeMl: number;

  @Column({ type: 'varchar', unique: true })
  sku: string;

  @Column({ type: 'integer' })
  available: number;
}
