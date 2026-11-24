import { EmptyRequests } from './EmptyRequests';
import { pluralize, type SavedRequest } from './savedRequest';
import { SavedRequestCard } from './SavedRequestCard';

type SavedRequestListProps = {
  requests: SavedRequest[];
};

export function SavedRequestList({ requests }: SavedRequestListProps) {
  return (
    <>
      <p className="mt-2 text-muted">
        Newest first. A saved request is waiting for review, so no stock is
        reserved and nothing is confirmed.
      </p>
      <p role="status" className="mt-4 text-sm font-medium">
        {pluralize(requests.length, 'request', 'requests')}
      </p>
      <div className="mt-4 flex flex-col gap-6">
        {requests.length === 0 ? (
          <EmptyRequests />
        ) : (
          requests.map((request) => (
            <SavedRequestCard key={request.id} request={request} />
          ))
        )}
      </div>
    </>
  );
}
