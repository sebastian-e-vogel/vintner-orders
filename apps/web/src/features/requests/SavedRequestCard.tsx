import { PolicyBadge } from '@/components/PolicyBadge';
import { formatDateTime } from '@/components/formatTimestamp';
import { RequestLinesTable } from './RequestLinesTable';
import { countShortLines, type SavedRequest } from './savedRequest';

type SavedRequestCardProps = {
  request: SavedRequest;
};

export function SavedRequestCard({ request }: SavedRequestCardProps) {
  const headingId = `request-${request.reference}`;
  const shortCount = countShortLines(request);
  const policyLabel = request.policy === 'strict' ? 'Strict' : 'Flexible';

  return (
    <article
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-md border border-border bg-surface p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id={headingId} className="text-lg font-semibold">
            {request.customer}
          </h2>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
            Pending review
          </span>
          {shortCount > 0 && (
            <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
              {shortCount} short at save
            </span>
          )}
        </div>
        <time dateTime={request.savedAt} className="font-bold">
          {formatDateTime(request.savedAt)}
        </time>
      </div>
      <dl className="grid gap-4 sm:grid-cols-4">
        <div>
          <dt className="text-sm text-muted">Caller</dt>
          <dd>
            {request.contactName}
            {request.contactName !== request.usualContact && (
              <span className="ml-1 text-xs text-muted">
                (usual: {request.usualContact})
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Phone</dt>
          <dd>{request.phone}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Taken by</dt>
          <dd>{request.repId}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Saved under</dt>
          <dd>
            <PolicyBadge policy={request.policy}>
              {policyLabel} policy
            </PolicyBadge>
          </dd>
        </div>
      </dl>
      <details open>
        <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          Wines and note
        </summary>
        <div className="mt-3 flex flex-col gap-4">
          <RequestLinesTable request={request} />
          {request.note && (
            <div className="rounded-md bg-background p-3 text-sm">
              <p className="text-xs font-medium uppercase text-muted">
                Note for the reviewer
              </p>
              <p className="mt-1">{request.note}</p>
            </div>
          )}
        </div>
      </details>
    </article>
  );
}
