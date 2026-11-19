import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { fromIssues } from './common/invalid-request.js';
import { CustomersModule } from './customers/customers.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health.controller.js';
import { OrderRequestsModule } from './order-requests/order-requests.module.js';
import { SalesRepsModule } from './sales-reps/sales-reps.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { WinesModule } from './wines/wines.module.js';

@Module({
  imports: [
    DatabaseModule,
    SettingsModule,
    WinesModule,
    CustomersModule,
    OrderRequestsModule,
    SalesRepsModule,
  ],
  controllers: [HealthController],
  // Registered here, not in main.ts, so the e2e tests get the same validation.
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new StandardSchemaValidationPipe({ exceptionFactory: fromIssues }),
    },
  ],
})
export class AppModule {}
