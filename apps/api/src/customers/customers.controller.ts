import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  customerIdSchema,
  type Customer,
  type LastTime,
} from '@vintner/contracts';
import { CustomersService } from './customers.service.js';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list(): Promise<Customer[]> {
    return this.customers.list();
  }

  @Get(':id/last-time')
  async lastTime(
    @Param('id', { schema: customerIdSchema }) id: string,
    // Nest sends an empty body for null; res.json writes the literal `null`.
    @Res() res: Response,
  ): Promise<void> {
    const lastTime: LastTime | null = await this.customers.lastTime(id);
    res.json(lastTime);
  }
}
