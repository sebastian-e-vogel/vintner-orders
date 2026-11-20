import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  inventoryPolicyResponseSchema,
  saveOrderRequestInvalidSchema,
  updateInventoryPolicyRequestSchema,
  type InventoryPolicyResponse,
  type UpdateInventoryPolicyRequest,
} from '@vintner/contracts';
import { InventoryPolicyService } from './inventory-policy.service.js';

@Controller('settings/inventory-policy')
export class SettingsController {
  constructor(private readonly inventoryPolicy: InventoryPolicyService) {}

  @Get()
  @ApiOperation({ summary: 'Get the inventory policy' })
  @ApiResponse({
    status: 200,
    description: 'Policy',
    standardSchema: inventoryPolicyResponseSchema,
  })
  get(): Promise<InventoryPolicyResponse> {
    return this.inventoryPolicy.get();
  }

  @Put()
  @ApiOperation({ summary: 'Set the inventory policy' })
  @ApiResponse({
    status: 200,
    description: 'Policy',
    standardSchema: inventoryPolicyResponseSchema,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
    standardSchema: saveOrderRequestInvalidSchema,
  })
  update(
    @Body({ schema: updateInventoryPolicyRequestSchema })
    body: UpdateInventoryPolicyRequest,
  ): Promise<InventoryPolicyResponse> {
    return this.inventoryPolicy.set(body.policy);
  }
}
