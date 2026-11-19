import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesRep } from '../database/entities/index.js';
import { SalesRepsService } from './sales-reps.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([SalesRep])],
  providers: [SalesRepsService],
  exports: [SalesRepsService],
})
export class SalesRepsModule {}
