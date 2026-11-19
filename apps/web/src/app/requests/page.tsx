import { PageHeading } from '@/components/PageHeading';
import { SavedRequestList } from '@/features/requests/SavedRequestList';
import { getSavedRequests } from '@/fixtures/savedRequests';

export default function RequestsPage() {
  return (
    <>
      <PageHeading>Saved requests</PageHeading>
      <SavedRequestList requests={getSavedRequests()} />
    </>
  );
}
