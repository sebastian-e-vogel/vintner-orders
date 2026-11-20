import { PageHeading } from '@/components/PageHeading';
import { Spinner } from '@/components/ui/Spinner';

export default function Loading() {
  return (
    <>
      <PageHeading>Inventory policy</PageHeading>
      <div role="status" className="mt-4 text-muted">
        <Spinner label="Loading inventory policy" />
      </div>
    </>
  );
}
