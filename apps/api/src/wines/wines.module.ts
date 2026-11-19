import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesRep, Wine } from '../database/entities/index.js';
import { RecentWinesController } from './recent-wines.controller.js';
import { RecentWinesService } from './recent-wines.service.js';
import { WinesController } from './wines.controller.js';
import { WinesService } from './wines.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Wine, SalesRep])],
  controllers: [WinesController, RecentWinesController],
  providers: [WinesService, RecentWinesService],
  exports: [WinesService],
})
export class WinesModule {}
