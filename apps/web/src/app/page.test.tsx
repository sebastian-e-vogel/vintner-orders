import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  customersFixture as customers,
  winesFixture as wines,
} from '@/features/order/testData';
import {
  getCustomers,
  getLastTime,
  getRecentWines,
  getWines,
} from '@/features/order/api';
import Home from './page';

vi.mock('@/features/settings/api', () => ({
  getInventoryPolicy: async () => ({
    policy: 'strict',
    changedAt: '2026-11-02T14:30:00.000Z',
  }),
}));
vi.mock('next/server', () => ({ connection: async () => {} }));
vi.mock('@/features/order/api', () => ({
  getCustomers: vi.fn(async () => customers),
  getWines: vi.fn(async () => wines),
  getRecentWines: vi.fn(async () => wines.slice(0, 2)),
  getLastTime: vi.fn(async () => null),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const renderHome = async (searchParams: Record<string, string | string[]>) =>
  render(await Home({ searchParams: Promise.resolve(searchParams) }));

describe('Home page', () => {
  it('renders the heading and the caller section with nothing selected', async () => {
    await renderHome({});
    expect(
      screen.getByRole('heading', { name: 'New order request', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Customer')).toHaveValue('');
  });

  it('shows the recent wines from the API', async () => {
    await renderHome({});
    expect(
      screen.getByRole('heading', { name: 'Your recent wines' }),
    ).toBeVisible();
    expect(
      screen.getByText(/^The last 2 different wines you added/),
    ).toBeVisible();
  });

  it('selects the customer from ?customer=', async () => {
    await renderHome({ customer: 'cus_harbour' });
    expect(screen.getByLabelText('Customer')).toHaveValue('cus_harbour');
  });

  it('shows the last-time card only once a customer is selected', async () => {
    await renderHome({ customer: 'cus_harbour' });
    expect(
      screen.getByRole('heading', { name: 'Last time', level: 2 }),
    ).toBeInTheDocument();
  });

  it('has no last-time card with nothing selected, and does not read it', async () => {
    vi.mocked(getLastTime).mockClear();
    await renderHome({});
    expect(getLastTime).not.toHaveBeenCalled();
    expect(screen.queryByText('Last time')).not.toBeInTheDocument();
  });

  it.each([
    ['unknown', { customer: 'nope' }],
    ['repeated', { customer: ['cus_harbour', 'cus_oakroom'] }],
  ])('selects nothing for a %s id', async (_, params) => {
    vi.mocked(getLastTime).mockClear();
    await renderHome(params);
    expect(screen.getByLabelText('Customer')).toHaveValue('');
    expect(getLastTime).not.toHaveBeenCalled();
  });

  it('shows the empty states when the API has no data', async () => {
    vi.mocked(getCustomers).mockResolvedValueOnce([]);
    vi.mocked(getWines).mockResolvedValueOnce([]);
    vi.mocked(getRecentWines).mockResolvedValueOnce([]);
    await renderHome({});
    expect(screen.getByLabelText('Customer')).toBeDisabled();
    expect(screen.getByText('No wines to show.')).toBeVisible();
    expect(screen.getByText("You haven't added any wines yet.")).toBeVisible();
  });

  it('rejects when the last-time read fails', async () => {
    vi.mocked(getLastTime).mockRejectedValueOnce(new Error('API down'));
    await expect(
      Home({ searchParams: Promise.resolve({ customer: 'cus_harbour' }) }),
    ).rejects.toThrow('API down');
  });

  it('rejects when a read fails, so error.tsx takes over', async () => {
    vi.mocked(getWines).mockRejectedValueOnce(new Error('API down'));
    await expect(Home({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      'API down',
    );
  });
});
