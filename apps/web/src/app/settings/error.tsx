'use client';

import { PageHeading } from '@/components/PageHeading';
import { Button } from '@/components/ui/Button';

type ErrorProps = {
  error: unknown;
  retry: () => void;
};

export default function Error({ retry }: ErrorProps) {
  return (
    <>
      <PageHeading>Inventory policy</PageHeading>
      <div
        role="alert"
        className="mt-6 flex flex-col items-start gap-3 rounded-md border border-border bg-surface p-6"
      >
        <h2 className="text-lg font-semibold">
          The inventory policy could not be loaded
        </h2>
        <p className="text-muted">Please try again in a moment.</p>
        <Button type="button" onClick={() => retry()}>
          Try again
        </Button>
      </div>
    </>
  );
}
