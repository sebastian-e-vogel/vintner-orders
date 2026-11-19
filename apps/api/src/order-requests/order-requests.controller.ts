import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  Res,
} from '@nestjs/common';
import {
  idempotencyKeySchema,
  orderRequestSchema,
  type SaveOrderRequestResponse,
} from '@vintner/contracts';
import type { Response } from 'express';
import type { $ZodIssue } from 'zod/v4/core';
import { OrderRequestsService } from './order-requests.service.js';

// Field path to the first message for that path.
const toFieldErrors = (issues: $ZodIssue[]) => {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    fieldErrors[issue.path.join('.') || 'body'] ??= issue.message;
  }
  return fieldErrors;
};

const invalid = (fieldErrors: Record<string, string>) =>
  new BadRequestException({ reason: 'invalid_request', fieldErrors });

@Controller('order-requests')
export class OrderRequestsController {
  constructor(private readonly orderRequests: OrderRequestsService) {}

  // Validated here, not with @Body({ schema }), to return our own 400 shape.
  @Post()
  async save(
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SaveOrderRequestResponse> {
    const key = idempotencyKeySchema.safeParse(idempotencyKey);
    if (!key.success) {
      throw invalid({
        'Idempotency-Key': 'Send a UUID in the Idempotency-Key header.',
      });
    }
    const parsed = orderRequestSchema.safeParse(body);
    if (!parsed.success) throw invalid(toFieldErrors(parsed.error.issues));

    const saved = await this.orderRequests.save(key.data, parsed.data);
    if (saved.duplicate) res.status(200);
    return saved;
  }
}
