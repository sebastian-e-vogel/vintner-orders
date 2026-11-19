import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Wine as WineResponse } from '@vintner/contracts';
import { DataSource, Repository } from 'typeorm';
import { SalesRep } from '../database/entities/index.js';
import { CURRENT_SALES_REP_ID } from '../sales-reps/current-sales-rep.js';

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
    @InjectRepository(SalesRep) private readonly salesReps: Repository<SalesRep>,
    private readonly dataSource: DataSource,
  ) {}

  async list(): Promise<WineResponse[]> {
    if (!(await this.salesReps.existsBy({ id: CURRENT_SALES_REP_ID }))) {
      throw new InternalServerErrorException(
        'The current sales rep is missing from the database. Run the seed with `pnpm db:seed`.',
      );
    }
    return this.dataSource.query<WineResponse[]>(recentWinesSql, [
      CURRENT_SALES_REP_ID,
    ]);
  }
}
