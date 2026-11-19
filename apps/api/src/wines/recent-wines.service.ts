import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Wine as WineResponse } from '@vintner/contracts';
import { Repository } from 'typeorm';
import { Wine } from '../database/entities/index.js';
import { SalesRepsService } from '../sales-reps/sales-reps.service.js';

// Newest date per wine first (GROUP BY dedups), then the limit, so repeats never shrink the list.
const recentWinesSql = `
  WITH activity AS (
    SELECT i.wine_id, o.ordered_at AS at
    FROM historical_order o JOIN historical_order_item i ON i.order_id = o.id
    WHERE o.sales_rep_id = $1
    UNION ALL
    SELECT i.wine_id, r.created_at
    FROM order_request r JOIN order_request_item i ON i.request_id = r.id
    WHERE r.sales_rep_id = $1
  ), latest AS (
    SELECT wine_id, max(at) AS at FROM activity GROUP BY wine_id
  )
  SELECT w.id, w.name, w.producer, w.vintage, w.format, w.sku, w.available
  FROM latest l JOIN wine w ON w.id = l.wine_id
  ORDER BY l.at DESC, w.id
  LIMIT 10`;

@Injectable()
export class RecentWinesService {
  constructor(
    private readonly salesReps: SalesRepsService,
    @InjectRepository(Wine) private readonly wines: Repository<Wine>,
  ) {}

  async list(): Promise<WineResponse[]> {
    const rep = await this.salesReps.getCurrent();
    return this.wines.query<WineResponse[]>(recentWinesSql, [rep.id]);
  }
}
