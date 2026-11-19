import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module.js';
import { OrderRequestsController } from './order-requests.controller.js';
import { OrderRequestsService } from './order-requests.service.js';

@Module({
  imports: [SettingsModule],
  controllers: [OrderRequestsController],
  providers: [OrderRequestsService],
})
export class OrderRequestsModule {}
