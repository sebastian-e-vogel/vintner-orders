import { connection } from 'next/server';
import { PageHeading } from '@/components/PageHeading';
import { getSavedRequests } from '@/features/requests/api';
import { SavedRequestList } from '@/features/requests/SavedRequestList';

export default async function RequestsPage() {
  await connection();
  const requests = await getSavedRequests();

  return (
    <>
      <PageHeading>Saved requests</PageHeading>
      <SavedRequestList requests={requests} />
    </>
  );
}
