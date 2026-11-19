import { PageHeading } from '@/components/PageHeading';
import { NewOrderDraft } from '@/features/order/NewOrderDraft';
import { customersFixture } from '@/fixtures/customers';
import { inventoryPolicyFixture } from '@/fixtures/inventoryPolicy';
import { winesFixture } from '@/fixtures/wines';

type HomeProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { customer } = await searchParams;
  const customerId = customersFixture.some(({ id }) => id === customer)
    ? (customer as string)
    : '';

  return (
    <>
      <PageHeading>New order request</PageHeading>
      <p className="mt-2 text-muted">
        Take a phone order for an existing customer. It is saved for review, and
        nothing is reserved or confirmed yet.
      </p>
      <NewOrderDraft
        customers={customersFixture}
        customerId={customerId}
        wines={winesFixture}
        policy={inventoryPolicyFixture.currentPolicy}
      />
    </>
  );
}
