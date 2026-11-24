import { connection } from 'next/server';
import { PageHeading } from '@/components/PageHeading';
import { NewOrderDraft } from '@/features/order/NewOrderDraft';
import { getCustomers, getRecentWines, getWines } from '@/features/order/api';
import { getInventoryPolicy } from '@/features/settings/api';
import { lastTimeFixture } from '@/fixtures/lastTime';

type HomeProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: HomeProps) {
  await connection();
  const [{ customer }, { policy }, customers, wines, recentWines] =
    await Promise.all([
      searchParams,
      getInventoryPolicy(),
      getCustomers(),
      getWines(),
      getRecentWines(),
    ]);
  const customerId = customers.some(({ id }) => id === customer)
    ? (customer as string)
    : '';

  return (
    <div data-wide>
      <PageHeading>New order request</PageHeading>
      <p className="mt-2 text-muted">
        Take a phone order for an existing customer. It is saved for review, and
        nothing is reserved or confirmed yet.
      </p>
      <NewOrderDraft
        customers={customers}
        customerId={customerId}
        wines={wines}
        recentWines={recentWines}
        policy={policy}
        lastTime={lastTimeFixture[customerId]}
      />
    </div>
  );
}
