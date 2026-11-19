import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Customer as CustomerResponse } from '@vintner/contracts';
import { Repository } from 'typeorm';
import { Customer } from '../database/entities/index.js';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
  ) {}

  list(): Promise<CustomerResponse[]> {
    return this.customers.find({
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
      },
      order: { name: 'ASC', id: 'ASC' },
    });
  }
}
