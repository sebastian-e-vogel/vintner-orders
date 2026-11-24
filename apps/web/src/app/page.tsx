import { PageHeading } from '@/components/PageHeading';
import { NewOrderDraft } from '@/features/order/NewOrderDraft';
import { getInventoryPolicy } from '@/features/settings/api';
import { customersFixture } from '@/fixtures/customers';
import { lastTimeFixture } from '@/fixtures/lastTime';
import { recentWinesFixture } from '@/fixtures/recentWines';
import { winesFixture } from '@/fixtures/wines';

type HomeProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { customer } = await searchParams;
  const customerId = customersFixture.some(({ id }) => id === customer)
    ? (customer as string)
    : '';
  const { policy } = await getInventoryPolicy();

  return (
    <div data-wide>
      <PageHeading>New order request</PageHeading>
      <p className="mt-2 text-muted">
        Take a phone order for an existing customer. It is saved for review, and
        nothing is reserved or confirmed yet.
      </p>
      <NewOrderDraft
        customers={customersFixture}
        customerId={customerId}
        wines={winesFixture}
        recentWines={recentWinesFixture}
        policy={policy}
        lastTime={lastTimeFixture[customerId]}
      />
    </div>
  );
}
