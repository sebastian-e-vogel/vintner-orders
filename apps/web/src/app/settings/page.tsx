import { PageHeading } from '@/components/PageHeading';
import { InventoryPolicyForm } from '@/features/settings/InventoryPolicyForm';
import { fakeSavePolicy } from '@/fixtures/fakeSavePolicy';
import { inventoryPolicyFixture } from '@/fixtures/inventoryPolicy';

export default function SettingsPage() {
  return (
    <>
      <PageHeading>Inventory policy</PageHeading>
      <InventoryPolicyForm
        {...inventoryPolicyFixture}
        onSave={fakeSavePolicy}
      />
    </>
  );
}
