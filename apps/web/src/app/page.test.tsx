import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Home from './page';

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

  it('selects the customer from ?customer=', async () => {
    await renderHome({ customer: 'cus_harbour' });
    expect(screen.getByLabelText('Customer')).toHaveValue('cus_harbour');
  });

  it.each([
    ['unknown', { customer: 'nope' }],
    ['repeated', { customer: ['cus_harbour', 'cus_oakroom'] }],
  ])('selects nothing for a %s id', async (_, params) => {
    await renderHome(params);
    expect(screen.getByLabelText('Customer')).toHaveValue('');
  });
});
