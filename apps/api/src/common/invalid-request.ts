import { BadRequestException } from '@nestjs/common';

// The 400 body of every endpoint: field path to its first message.
export const invalidRequest = (fieldErrors: Record<string, string>) =>
  new BadRequestException({ reason: 'invalid_request', fieldErrors });

// The part of a Standard Schema issue we use.
type Issue = {
  message: string;
  path?: readonly (PropertyKey | { key: PropertyKey })[];
};

const pathKey = (segment: PropertyKey | { key: PropertyKey }) =>
  String(typeof segment === 'object' ? segment.key : segment);

// `body` stands for an issue with no path, such as a missing body.
export const fromIssues = (issues: readonly Issue[]) => {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    fieldErrors[issue.path?.map(pathKey).join('.') || 'body'] ??= issue.message;
  }
  return invalidRequest(fieldErrors);
};
