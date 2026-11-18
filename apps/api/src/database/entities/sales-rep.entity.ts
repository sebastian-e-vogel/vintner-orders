import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class SalesRep {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;
}
