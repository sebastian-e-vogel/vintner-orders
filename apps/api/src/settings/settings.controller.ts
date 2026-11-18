import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  updateInventoryPolicyRequestSchema,
  type InventoryPolicyResponse,
  type UpdateInventoryPolicyRequest,
} from '@vintner/contracts';
import { InventoryPolicyService } from './inventory-policy.service.js';

@Controller('settings/inventory-policy')
export class SettingsController {
  constructor(private readonly inventoryPolicy: InventoryPolicyService) {}

  @Get()
  get(): Promise<InventoryPolicyResponse> {
    return this.inventoryPolicy.get();
  }

  @Put()
  update(
    @Body({ schema: updateInventoryPolicyRequestSchema })
    body: UpdateInventoryPolicyRequest,
  ): Promise<InventoryPolicyResponse> {
    return this.inventoryPolicy.set(body.policy);
  }
}
