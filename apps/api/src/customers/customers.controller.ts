import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  customerIdSchema,
  customerListSchema,
  lastTimeResponseSchema,
  saveOrderRequestInvalidSchema,
  type Customer,
  type LastTime,
} from '@vintner/contracts';
import { CustomersService } from './customers.service.js';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List customers' })
  @ApiResponse({
    status: 200,
    description: 'Customers',
    standardSchema: customerListSchema,
  })
  list(): Promise<Customer[]> {
    return this.customers.list();
  }

  @Get(':id/last-time')
  @ApiOperation({ summary: 'What the customer ordered last time' })
  @ApiResponse({
    status: 200,
    description: 'The last order or request, or null without history',
    standardSchema: lastTimeResponseSchema,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
    standardSchema: saveOrderRequestInvalidSchema,
  })
  async lastTime(
    @Param('id', { schema: customerIdSchema }) id: string,
    // Nest sends an empty body for null; res.json writes the literal `null`.
    @Res() res: Response,
  ): Promise<void> {
    const lastTime: LastTime | null = await this.customers.lastTime(id);
    res.json(lastTime);
  }
}
