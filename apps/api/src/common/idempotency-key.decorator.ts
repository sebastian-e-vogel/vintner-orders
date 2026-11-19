import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { idempotencyKeySchema } from '@vintner/contracts';
import type { Request } from 'express';
import { invalidRequest } from './invalid-request.js';

// Custom decorators skip the global pipe, so the header is validated here.
export const IdempotencyKey = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const key = idempotencyKeySchema.safeParse(
      context.switchToHttp().getRequest<Request>().header('idempotency-key'),
    );
    if (!key.success) {
      throw invalidRequest({
        'Idempotency-Key': 'Send a UUID in the Idempotency-Key header.',
      });
    }
    return key.data;
  },
);
