import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settings } from '../database/entities/index.js';
import { InventoryPolicyService } from './inventory-policy.service.js';
import { SettingsController } from './settings.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Settings])],
  controllers: [SettingsController],
  providers: [InventoryPolicyService],
  exports: [InventoryPolicyService],
})
export class SettingsModule {}
