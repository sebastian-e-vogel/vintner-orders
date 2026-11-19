import { Controller, Get } from '@nestjs/common';
import type { Customer } from '@vintner/contracts';
import { CustomersService } from './customers.service.js';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list(): Promise<Customer[]> {
    return this.customers.list();
  }
}
