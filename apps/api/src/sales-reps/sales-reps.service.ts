import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SalesRep } from '../database/entities/index.js';
import { CURRENT_SALES_REP_ID } from './current-sales-rep.js';

@Injectable()
export class SalesRepsService {
  constructor(
    @InjectRepository(SalesRep)
    private readonly salesReps: Repository<SalesRep>,
  ) {}

  // Phase 3 changes only this method: it will read the logged-in user.
  async getCurrent(manager?: EntityManager): Promise<SalesRep> {
    const rep = await (
      manager?.getRepository(SalesRep) ?? this.salesReps
    ).findOneBy({ id: CURRENT_SALES_REP_ID });
    if (!rep) {
      throw new InternalServerErrorException(
        'The current sales rep does not exist. Run the seed.',
      );
    }
    return rep;
  }
}
