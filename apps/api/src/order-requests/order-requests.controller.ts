import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  orderRequestSchema,
  saveOrderRequestInvalidSchema,
  saveOrderRequestRejectedSchema,
  saveOrderRequestResponseSchema,
  savedRequestCountSchema,
  savedRequestListSchema,
  type OrderRequest,
  type SaveOrderRequestResponse,
  type SavedRequestCount,
  type SavedRequestListItem,
} from '@vintner/contracts';
import type { Response } from 'express';
import { IdempotencyKey } from '../common/idempotency-key.decorator.js';
import { OrderRequestsService } from './order-requests.service.js';

@Controller('order-requests')
export class OrderRequestsController {
  constructor(private readonly orderRequests: OrderRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Save an order request' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiResponse({
    status: 200,
    description: 'Repeated key and body (`duplicate: true`)',
    standardSchema: saveOrderRequestResponseSchema,
  })
  @ApiResponse({
    status: 201,
    description: 'Saved',
    standardSchema: saveOrderRequestResponseSchema,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
    standardSchema: saveOrderRequestInvalidSchema,
  })
  @ApiResponse({
    status: 422,
    description: 'Well formed but cannot be saved',
    standardSchema: saveOrderRequestRejectedSchema,
  })
  async save(
    @IdempotencyKey() key: string,
    @Body({ schema: orderRequestSchema }) body: OrderRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SaveOrderRequestResponse> {
    const saved = await this.orderRequests.save(key, body);
    if (saved.duplicate) res.status(200);
    return saved;
  }

  @Get()
  @ApiOperation({ summary: 'List saved order requests' })
  @ApiResponse({
    status: 200,
    description: 'Saved requests',
    standardSchema: savedRequestListSchema,
  })
  list(): Promise<SavedRequestListItem[]> {
    return this.orderRequests.list();
  }

  @Get('count')
  @ApiOperation({ summary: 'Count saved order requests' })
  @ApiResponse({
    status: 200,
    description: 'Count',
    standardSchema: savedRequestCountSchema,
  })
  count(): Promise<SavedRequestCount> {
    return this.orderRequests.count();
  }
}
