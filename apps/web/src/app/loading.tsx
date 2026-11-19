import { Spinner } from '@/components/ui/Spinner';

export default function Loading() {
  return (
    <div role="status" className="text-muted">
      <Spinner label="Loading" />
    </div>
  );
}
