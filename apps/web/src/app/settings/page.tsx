import { connection } from 'next/server';
import { PageHeading } from '@/components/PageHeading';
import { getSavedRequestCount } from '@/features/requests/api';
import { InventoryPolicyForm } from '@/features/settings/InventoryPolicyForm';
import { getInventoryPolicy } from '@/features/settings/api';
import { saveInventoryPolicy } from '@/features/settings/actions';

export default async function SettingsPage() {
  await connection();
  const [{ policy, changedAt }, savedRequestCount] = await Promise.all([
    getInventoryPolicy(),
    getSavedRequestCount(),
  ]);

  return (
    <>
      <PageHeading>Inventory policy</PageHeading>
      <InventoryPolicyForm
        currentPolicy={policy}
        changedAt={changedAt}
        savedRequestCount={savedRequestCount}
        onSave={saveInventoryPolicy}
      />
    </>
  );
}
