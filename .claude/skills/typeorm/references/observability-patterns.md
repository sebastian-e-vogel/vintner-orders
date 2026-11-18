# Query logging

## Local development

Log only slow queries and errors so the console stays readable:

```typescript
{
  logging: ['error', 'warn'],
  maxQueryExecutionTime: 200, // ms, slow queries are logged as warnings
}
```

Turn on `logging: ['query']` temporarily when debugging a specific query.

## Custom logger

Implement TypeORM's `Logger` interface and delegate to the Nest `Logger`, so database logs share format and level with the rest of the API:

```typescript
import { Logger as NestLogger } from '@nestjs/common';
import { Logger } from 'typeorm';

export class TypeOrmNestLogger implements Logger {
  private readonly logger = new NestLogger('TypeORM');

  logQuery() {}
  logQueryError(error: string | Error, query: string) {
    this.logger.error(`${error} | ${query}`);
  }
  logQuerySlow(time: number, query: string) {
    this.logger.warn(`Slow query (${time}ms): ${query}`);
  }
  logSchemaBuild(message: string) { this.logger.log(message); }
  logMigration(message: string) { this.logger.log(message); }
  log(level: 'log' | 'info' | 'warn', message: unknown) {
    if (level === 'warn') this.logger.warn(String(message));
    else this.logger.log(String(message));
  }
}
```

Register it with `logger: new TypeOrmNestLogger()` in the options.

## Do not log

Query parameters can hold personal data (emails, phones, addresses). Log the SQL, not the parameters.
