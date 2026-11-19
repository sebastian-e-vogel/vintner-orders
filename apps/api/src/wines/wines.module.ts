import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wine } from '../database/entities/index.js';
import { SalesRepsModule } from '../sales-reps/sales-reps.module.js';
import { RecentWinesController } from './recent-wines.controller.js';
import { RecentWinesService } from './recent-wines.service.js';
import { WinesController } from './wines.controller.js';
import { WinesService } from './wines.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Wine]), SalesRepsModule],
  controllers: [WinesController, RecentWinesController],
  providers: [WinesService, RecentWinesService],
  exports: [WinesService],
})
export class WinesModule {}
