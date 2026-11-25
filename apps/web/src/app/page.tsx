import { connection } from 'next/server';
import { PageHeading } from '@/components/PageHeading';
import { saveOrderRequest } from '@/features/order/actions';
import { NewOrderDraft } from '@/features/order/NewOrderDraft';
import {
  getCustomers,
  getLastTime,
  getRecentWines,
  getWines,
} from '@/features/order/api';
import { getInventoryPolicy } from '@/features/settings/api';

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
  const lastTime = customerId ? await getLastTime(customerId) : null;

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
        lastTime={lastTime}
        onSave={saveOrderRequest}
      />
    </div>
  );
}
