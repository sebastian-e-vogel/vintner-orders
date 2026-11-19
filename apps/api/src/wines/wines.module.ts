import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wine } from '../database/entities/index.js';
import { WinesController } from './wines.controller.js';
import { WinesService } from './wines.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Wine])],
  controllers: [WinesController],
  providers: [WinesService],
  exports: [WinesService],
})
export class WinesModule {}
