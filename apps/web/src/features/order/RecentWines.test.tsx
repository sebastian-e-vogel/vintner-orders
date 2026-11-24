import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { winesFixture } from './testData';
import { RecentWines } from './RecentWines';

const inStock = winesFixture.find(({ available }) => available >= 10)!;
const outOfStock = winesFixture.find(({ available }) => available === 0)!;

function renderCard(
  props: {
    wines?: typeof winesFixture;
    lines?: Record<string, string>;
    policy?: InventoryPolicy;
  } = {},
) {
  const onPick = vi.fn();
  render(
    <RecentWines
      wines={[inStock, outOfStock]}
      lines={{}}
      policy="strict"
      {...props}
      onPick={onPick}
    />,
  );
  return { onPick, user: userEvent.setup() };
}

describe('RecentWines', () => {
  it('shows the empty state', () => {
    renderCard({ wines: [] });
    expect(screen.getByText("You haven't added any wines yet.")).toBeVisible();
    expect(screen.getByText(/will show up here/)).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('counts the wines in the subtitle and lists one button per wine', () => {
    renderCard();
    expect(
      screen.getByText(
        'The last 2 different wines you added, for any customer. Newest first.',
      ),
    ).toBeVisible();
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByRole('button')).toBeInTheDocument();
  });

  it('shows availability and an accessible name that says what a click does', () => {
    renderCard({ policy: 'flexible' });
    const chip = screen.getByRole('button', {
      name: new RegExp(
        `^Enter quantity for .*, ${inStock.available} available$`,
      ),
    });
    expect(chip).toBeEnabled();
    expect(
      within(chip).getByText(`${inStock.available} available`),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: /, Out of stock$/ }),
    ).toBeEnabled();
  });

  it('blocks a zero-stock wine under strict policy', () => {
    renderCard();
    expect(
      screen.getByRole('button', {
        name: /Out of stock, can't add under strict policy$/,
      }),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows the quantity when the wine is in the request', () => {
    renderCard({ lines: { [inStock.id]: '12' } });
    const chip = screen.getByRole('button', {
      name: /, already in this request$/,
    });
    expect(within(chip).getByText('In request · 12')).toBeVisible();
    expect(within(chip).queryByText(/available/)).not.toBeInTheDocument();
  });

  it('shows "In request" alone for an empty quantity and keeps a blocked wine enabled once in the request', () => {
    renderCard({ lines: { [outOfStock.id]: '' } });
    const chip = screen.getByRole('button', {
      name: /, already in this request$/,
    });
    expect(within(chip).getByText('In request')).toBeVisible();
    expect(chip).toBeEnabled();
  });

  it('calls onPick with the wine id, also for a wine already in the request', async () => {
    const { onPick, user } = renderCard({ lines: { [outOfStock.id]: '' } });
    await user.click(
      screen.getByRole('button', { name: /^Enter quantity for/ }),
    );
    await user.click(
      screen.getByRole('button', { name: /already in this request$/ }),
    );
    expect(onPick).toHaveBeenNthCalledWith(1, inStock.id);
    expect(onPick).toHaveBeenNthCalledWith(2, outOfStock.id);
  });

  it('still calls onPick for a blocked chip so the page can explain why', async () => {
    const { onPick, user } = renderCard();
    await user.click(
      screen.getByRole('button', { name: /can't add under strict policy$/ }),
    );
    expect(onPick).toHaveBeenCalledWith(outOfStock.id);
  });
});
