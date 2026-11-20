import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { healthResponseSchema, type HealthResponse } from '@vintner/contracts';

@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness check' })
  @ApiResponse({
    status: 200,
    description: 'OK',
    standardSchema: healthResponseSchema,
  })
  check(): HealthResponse {
    return { status: 'ok' };
  }
}
