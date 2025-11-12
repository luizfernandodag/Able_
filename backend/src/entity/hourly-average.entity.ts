import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
@Index(['pair','hourStart'], { unique: true })
export class HourlyAverage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  pair!: string;

  @Column()
  hourStart!: string;

  @Column('float')
  avgPrice!: number;

  @Column()
  sampleCount!: number;
}
