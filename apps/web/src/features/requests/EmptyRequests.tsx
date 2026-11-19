import Link from 'next/link';

export function EmptyRequests() {
  return (
    <section className="flex flex-col items-start gap-3 rounded-md border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold">No saved requests yet</h2>
      <p className="text-muted">
        Requests show up here once they are saved from the order page.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        New order request
      </Link>
    </section>
  );
}
