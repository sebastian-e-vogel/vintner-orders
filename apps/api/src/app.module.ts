import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health.controller.js';
import { SettingsModule } from './settings/settings.module.js';

@Module({
  imports: [DatabaseModule, SettingsModule],
  controllers: [HealthController],
  // Registered here, not in main.ts, so the e2e tests get the same validation.
  providers: [
    { provide: APP_PIPE, useFactory: () => new StandardSchemaValidationPipe() },
  ],
})
export class AppModule {}
