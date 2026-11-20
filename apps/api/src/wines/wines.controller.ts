import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { wineListSchema, type Wine } from '@vintner/contracts';
import { WinesService } from './wines.service.js';

@Controller('wines')
export class WinesController {
  constructor(private readonly wines: WinesService) {}

  @Get()
  @ApiOperation({ summary: 'List the wine catalog with available stock' })
  @ApiResponse({
    status: 200,
    description: 'Wines',
    standardSchema: wineListSchema,
  })
  list(): Promise<Wine[]> {
    return this.wines.list();
  }
}
