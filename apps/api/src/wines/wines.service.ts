import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Wine as WineResponse } from '@vintner/contracts';
import { Repository } from 'typeorm';
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
        format: true,
        sku: true,
        available: true,
      },
      order: {
        name: 'ASC',
        vintage: { direction: 'ASC', nulls: 'LAST' },
        format: 'ASC',
        sku: 'ASC',
      },
    });
  }
}
