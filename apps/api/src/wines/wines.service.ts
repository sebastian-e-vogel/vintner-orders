import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Wine as WineResponse } from '@vintner/contracts';
import { EntityManager, In, Repository } from 'typeorm';
import { Wine } from '../database/entities/index.js';

@Injectable()
export class WinesService {
  constructor(
    @InjectRepository(Wine) private readonly wines: Repository<Wine>,
  ) {}

  list(): Promise<WineResponse[]> {
    return this.wines.find({
      select: {
        id: true,
        name: true,
        producer: true,
        vintage: true,
        region: true,
        sizeMl: true,
        sku: true,
        available: true,
      },
      order: {
        name: 'ASC',
        vintage: { direction: 'ASC', nulls: 'LAST' },
        sizeMl: 'ASC',
        sku: 'ASC',
      },
    });
  }

  // Wine id to available stock; ids that do not exist are left out.
  async findAvailability(
    ids: string[],
    manager?: EntityManager,
  ): Promise<Record<string, number>> {
    const wines = await (manager?.getRepository(Wine) ?? this.wines).find({
      select: { id: true, available: true },
      where: { id: In(ids) },
    });
    return Object.fromEntries(wines.map((wine) => [wine.id, wine.available]));
  }
}
