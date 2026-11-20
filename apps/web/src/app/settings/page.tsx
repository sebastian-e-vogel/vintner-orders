import { connection } from 'next/server';
import { PageHeading } from '@/components/PageHeading';
import { InventoryPolicyForm } from '@/features/settings/InventoryPolicyForm';
import { getInventoryPolicy } from '@/features/settings/inventoryPolicyApi';
import { saveInventoryPolicy } from '@/features/settings/saveInventoryPolicy';
import { inventoryPolicyFixture } from '@/fixtures/inventoryPolicy';

export default async function SettingsPage() {
  await connection();
  const { policy, changedAt } = await getInventoryPolicy();

  return (
    <>
      <PageHeading>Inventory policy</PageHeading>
      <InventoryPolicyForm
        currentPolicy={policy}
        changedAt={changedAt}
        // TEMPORARY: no endpoint yet, see #36.
        savedRequestCount={inventoryPolicyFixture.savedRequestCount}
        onSave={saveInventoryPolicy}
      />
    </>
  );
}
