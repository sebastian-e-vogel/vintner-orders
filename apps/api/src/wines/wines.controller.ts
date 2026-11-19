import { Controller, Get } from '@nestjs/common';
import type { Wine } from '@vintner/contracts';
import { WinesService } from './wines.service.js';

@Controller('wines')
export class WinesController {
  constructor(private readonly wines: WinesService) {}

  @Get()
  list(): Promise<Wine[]> {
    return this.wines.list();
  }
}
