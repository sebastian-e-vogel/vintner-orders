import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module.js';
import { SalesRepsModule } from '../sales-reps/sales-reps.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { WinesModule } from '../wines/wines.module.js';
import { OrderRequestsController } from './order-requests.controller.js';
import { OrderRequestsService } from './order-requests.service.js';

@Module({
  imports: [SettingsModule, CustomersModule, WinesModule, SalesRepsModule],
  controllers: [OrderRequestsController],
  providers: [OrderRequestsService],
})
export class OrderRequestsModule {}
