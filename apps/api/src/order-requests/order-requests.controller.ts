import { Body, Controller, Post, Res } from '@nestjs/common';
import {
  orderRequestSchema,
  type OrderRequest,
  type SaveOrderRequestResponse,
} from '@vintner/contracts';
import type { Response } from 'express';
import { IdempotencyKey } from '../common/idempotency-key.decorator.js';
import { OrderRequestsService } from './order-requests.service.js';

@Controller('order-requests')
export class OrderRequestsController {
  constructor(private readonly orderRequests: OrderRequestsService) {}

  @Post()
  async save(
    @IdempotencyKey() key: string,
    @Body({ schema: orderRequestSchema }) body: OrderRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SaveOrderRequestResponse> {
    const saved = await this.orderRequests.save(key, body);
    if (saved.duplicate) res.status(200);
    return saved;
  }
}
