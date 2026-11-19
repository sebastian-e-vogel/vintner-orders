import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { repsFixture } from '@/fixtures/reps';
import { winesFixture } from '@/fixtures/wines';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { LastTimeCard } from './LastTimeCard';
import type { LastTime } from './lastTime';

const order: LastTime = {
  kind: 'order',
  order: {
    id: 'o1',
    customerId: 'c',
    repId: 'rep-2',
    date: '2026-11-10T14:40:00.000Z',
    items: [
      { wineId: 'wine_03', quantity: 12 },
      { wineId: 'wine_19', quantity: 6 },
      { wineId: 'wine_06', quantity: 3 },
      { wineId: 'gone', quantity: 2 },
    ],
  },
};
const pending: LastTime = {
  kind: 'request',
  request: {
    id: 'r1',
    customerId: 'c',
    contactName: 'Priya Nair',
    date: '2026-11-17T11:20:00.000Z',
    items: [{ wineId: 'wine_03', quantity: 4 }],
  },
};

function setup(
  props: {
    last?: LastTime;
    isLoading?: boolean;
    policy?: InventoryPolicy;
    lines?: Record<string, string>;
  } = {},
) {
  const onAdd = vi.fn();
  render(
    <LastTimeCard
      customerName="Harbour Wine Bar"
      isLoading={props.isLoading ?? false}
      last={props.last}
      reps={repsFixture}
      wines={winesFixture}
      lines={props.lines ?? {}}
      policy={props.policy ?? 'flexible'}
      onAdd={onAdd}
    />,
  );
  return { onAdd, user: userEvent.setup() };
}

const list = () => screen.getByRole('list', { name: 'Wines last time' });

describe('LastTimeCard states', () => {
  it('shows a past order with date and rep', () => {
    setup({ last: order });
    expect(
      screen.getByRole('heading', { level: 2, name: 'Last time' }),
    ).toBeVisible();
    expect(screen.getByText('Past order')).toBeVisible();
    expect(
      screen.getByText('Tuesday, November 10, 2026 · taken by Tom Bennett'),
    ).toHaveClass('text-muted');
    expect(screen.queryByText(/Nobody has reviewed/)).not.toBeInTheDocument();
  });

  it('shows a pending saved request with a warning', () => {
    setup({ last: pending });
    expect(screen.getByText('Saved request · pending review')).toBeVisible();
    expect(
      screen.getByText('Tuesday, November 17, 2026 · caller Priya Nair'),
    ).toBeVisible();
    expect(screen.getByText(/Nobody has reviewed this request/)).toBeVisible();
  });

  it('shows the empty state without history', () => {
    setup();
    expect(
      screen.getByText(
        'No previous orders or saved requests for Harbour Wine Bar.',
      ),
    ).toHaveClass('text-muted');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows a busy status while loading and hides the content', () => {
    setup({ last: order, isLoading: true });
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading last time for Harbour Wine Bar…');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

describe('LastTimeCard items', () => {
  it('shows quantity, full wine, size, and NV', () => {
    setup({ last: order });
    const first = within(list()).getAllByRole('listitem')[0];
    expect(first).toHaveTextContent('12 ×');
    expect(first).toHaveTextContent('Domaine Aubert Pinot Noir Reserve 2022');
    expect(within(first).getByText('750 ml')).toBeVisible();
    const nv = within(list()).getAllByRole('listitem')[1];
    expect(within(nv).getByText('NV')).toHaveAttribute('title', 'Non-vintage');
  });

  it('adds a single wine with a descriptive Add button', async () => {
    const { onAdd, user } = setup({ last: order });
    await user.click(
      screen.getByRole('button', {
        name: 'Add Domaine Aubert Pinot Noir Reserve 2022, 750 ml without a quantity, last time 12',
      }),
    );
    expect(onAdd).toHaveBeenCalledWith(['wine_03']);
  });

  it('shows In request instead of Add for wines already in the request', () => {
    setup({ last: order, lines: { wine_03: '' } });
    const first = within(list()).getAllByRole('listitem')[0];
    expect(within(first).getByText('In request')).toBeVisible();
    expect(within(first).queryByRole('button')).not.toBeInTheDocument();
  });

  it('under strict, blocks an out-of-stock wine with a danger note', () => {
    setup({ last: order, policy: 'strict' });
    const row = within(list()).getAllByRole('listitem')[2];
    expect(
      within(row).getByText(/Out of stock — can't add \(strict\)/),
    ).toHaveClass('text-danger');
    expect(within(row).getByRole('button', { name: /^Add/ })).toBeDisabled();
  });

  it('under flexible, warns about an out-of-stock wine but allows adding', () => {
    setup({ last: order, policy: 'flexible' });
    const row = within(list()).getAllByRole('listitem')[2];
    expect(
      within(row).getByText('Out of stock — will be flagged short'),
    ).toHaveClass('text-warning');
    expect(within(row).getByRole('button', { name: /^Add/ })).toBeEnabled();
  });

  it('hides the flexible out-of-stock note once the wine is in the request', () => {
    setup({ last: order, lines: { wine_06: '' } });
    expect(screen.queryByText(/will be flagged short/)).not.toBeInTheDocument();
  });

  it('shows a wine that left the catalog, without an Add button', () => {
    setup({ last: order });
    const row = within(list()).getAllByRole('listitem')[3];
    expect(within(row).getByText('2 ×')).toBeVisible();
    expect(within(row).getByText(/not in the catalog any more/)).toHaveClass(
      'text-muted',
    );
    expect(within(row).queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('LastTimeCard Add all', () => {
  it('under flexible adds every addable wine and reports the rest', async () => {
    const { onAdd, user } = setup({ last: order, lines: { wine_19: '' } });
    await user.click(screen.getByRole('button', { name: 'Add 2 wines' }));
    expect(onAdd).toHaveBeenCalledWith(
      ['wine_03', 'wine_06'],
      'from last time',
      {
        inRequest: 1,
        blocked: 1,
      },
    );
  });

  it('is labelled Add all N when everything can be added', () => {
    setup({ last: pending });
    expect(screen.getByRole('button', { name: 'Add 1 wine' })).toBeEnabled();
  });

  it('skips strict-blocked wines', async () => {
    const { onAdd, user } = setup({ last: order, policy: 'strict' });
    await user.click(screen.getByRole('button', { name: 'Add 2 wines' }));
    expect(onAdd.mock.calls[0][0]).toEqual(['wine_03', 'wine_19']);
  });

  it('is disabled with "All in this request" when all are in', () => {
    setup({ last: pending, lines: { wine_03: '2' } });
    expect(
      screen.getByRole('button', { name: 'All in this request' }),
    ).toBeDisabled();
  });

  it('is disabled with "Nothing more to add" when the rest is blocked', () => {
    setup({
      last: order,
      policy: 'strict',
      lines: { wine_03: '', wine_19: '' },
    });
    expect(
      screen.getByRole('button', { name: 'Nothing more to add' }),
    ).toBeDisabled();
  });

  it('explains quantities in a help line', () => {
    setup({ last: order });
    expect(screen.getByText(/added without quantities/)).toBeVisible();
  });
});
