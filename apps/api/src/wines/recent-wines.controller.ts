import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { wineListSchema, type Wine } from '@vintner/contracts';
import { RecentWinesService } from './recent-wines.service.js';

@Controller('recent-wines')
export class RecentWinesController {
  constructor(private readonly recentWines: RecentWinesService) {}

  @Get()
  @ApiOperation({ summary: 'List recently ordered wines' })
  @ApiResponse({
    status: 200,
    description: 'Wines',
    standardSchema: wineListSchema,
  })
  list(): Promise<Wine[]> {
    return this.recentWines.list();
  }
}
