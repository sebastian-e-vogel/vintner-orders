'use client';

import { PageHeading } from '@/components/PageHeading';

type ErrorProps = {
  error: unknown;
  retry: () => void;
};

export default function Error({ retry }: ErrorProps) {
  return (
    <div role="alert" className="space-y-4">
      <PageHeading>Something went wrong</PageHeading>
      <p className="text-danger">
        The page could not be loaded. Please try again.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Try again
      </button>
    </div>
  );
}
