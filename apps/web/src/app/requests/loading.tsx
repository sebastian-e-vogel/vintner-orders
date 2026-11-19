import { PageHeading } from '@/components/PageHeading';

export default function Loading() {
  return (
    <>
      <PageHeading>Saved requests</PageHeading>
      <p role="status" className="mt-4 text-muted">
        Loading saved requests…
      </p>
    </>
  );
}
