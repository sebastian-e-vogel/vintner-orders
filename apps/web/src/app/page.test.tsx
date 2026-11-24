import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Home from './page';

vi.mock('@/features/settings/api', () => ({
  getInventoryPolicy: async () => ({
    policy: 'strict',
    changedAt: '2026-11-02T14:30:00.000Z',
  }),
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

  it("shows the rep's recent wines, at most 10", async () => {
    await renderHome({});
    expect(
      screen.getByRole('heading', { name: 'Your recent wines' }),
    ).toBeVisible();
    expect(
      screen.getByText(/^The last 10 different wines you added/),
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

  it('has no last-time card with nothing selected', async () => {
    await renderHome({});
    expect(screen.queryByText('Last time')).not.toBeInTheDocument();
  });

  it.each([
    ['unknown', { customer: 'nope' }],
    ['repeated', { customer: ['cus_harbour', 'cus_oakroom'] }],
  ])('selects nothing for a %s id', async (_, params) => {
    await renderHome(params);
    expect(screen.getByLabelText('Customer')).toHaveValue('');
  });
});
