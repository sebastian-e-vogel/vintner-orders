import { Module } from '@nestjs/common';
import { InventoryPolicyService } from './inventory-policy.service.js';
import { SettingsController } from './settings.controller.js';

@Module({
  controllers: [SettingsController],
  providers: [InventoryPolicyService],
  exports: [InventoryPolicyService],
})
export class SettingsModule {}
