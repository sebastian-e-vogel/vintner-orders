import Link from 'next/link';
import { PageHeading } from '@/components/PageHeading';

export default function NotFound() {
  return (
    <div className="space-y-4">
      <PageHeading>Page not found</PageHeading>
      <p className="text-muted">This page does not exist.</p>
      <Link href="/" className="text-primary underline">
        Back to new order
      </Link>
    </div>
  );
}
