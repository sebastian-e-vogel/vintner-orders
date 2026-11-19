import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module.js';
import { OrderRequest, OrderRequestItem } from '../database/entities/index.js';
import { SalesRepsModule } from '../sales-reps/sales-reps.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { WinesModule } from '../wines/wines.module.js';
import { OrderRequestsController } from './order-requests.controller.js';
import { OrderRequestsService } from './order-requests.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderRequest, OrderRequestItem]),
    SettingsModule,
    CustomersModule,
    WinesModule,
    SalesRepsModule,
  ],
  controllers: [OrderRequestsController],
  providers: [OrderRequestsService],
})
export class OrderRequestsModule {}
