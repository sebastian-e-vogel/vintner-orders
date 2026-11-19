import { Controller, Get } from '@nestjs/common';
import type { Wine } from '@vintner/contracts';
import { RecentWinesService } from './recent-wines.service.js';

@Controller('recent-wines')
export class RecentWinesController {
  constructor(private readonly recentWines: RecentWinesService) {}

  @Get()
  list(): Promise<Wine[]> {
    return this.recentWines.list();
  }
}
