import type {
  OrderRequestInput,
  SaveOrderRequestRejected,
  SaveOrderRequestResponse,
} from '@vintner/contracts';

// A definite answer from the server.
export type AnsweredSave =
  | { status: 'saved'; request: SaveOrderRequestResponse }
  | { status: 'invalid'; fieldErrors: Record<string, string> }
  | { status: 'rejected'; rejection: SaveOrderRequestRejected };

// `error` is a network or server failure: the request may or may not have been saved.
export type SaveResult = AnsweredSave | { status: 'error' };

export type OnSave = (
  input: OrderRequestInput,
  idempotencyKey: string,
) => Promise<SaveResult>;

// The key is kept only after `error`, so a retry cannot create a second request.
export const isAnswered = (result: SaveResult): result is AnsweredSave =>
  result.status !== 'error';
