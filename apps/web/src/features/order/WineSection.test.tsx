import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { winesFixture } from '@/fixtures/wines';
import { WineSection } from './WineSection';
import type { Wine } from './wine';

function Harness({
  policy,
  wines = winesFixture,
}: {
  policy: InventoryPolicy;
  wines?: Wine[];
}) {
  const [lines, setLines] = useState<Record<string, string>>({});
  return (
    <WineSection
      wines={wines}
      lines={lines}
      policy={policy}
      lastTimeQuantities={{}}
      statusMessage=""
      onQuantityChange={(id, text) => setLines((c) => ({ ...c, [id]: text }))}
    />
  );
}

// wine_03: 120 avail, wine_04: 36, wine_14: 5 (low), wine_06: 0 stock, wine_07: 9
const qty = (name: RegExp | string) => screen.getByRole('textbox', { name });
const aubrey1500 = /Domaine Aubrey Pinot Noir Reserve 2022, 1\.5 L/;
const holtz2023 = /Holtz Estate Riesling Kabinett 2023, 750 ml/;

function setup(policy: InventoryPolicy, wines?: Wine[]) {
  render(<Harness policy={policy} wines={wines} />);
  return userEvent.setup();
}

describe('WineSection catalog', () => {
  it('shows the step heading and one group per producer', () => {
    setup('strict');
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Wines — type a quantity to add it/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Riverstone' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 4, name: 'Pinot Noir Reserve' }),
    ).toHaveLength(2);
    expect(screen.queryByText(/confirm which one/)).not.toBeInTheDocument();
  });

  it('shows vintage, region, size, SKU and availability on each row', () => {
    setup('strict');
    const row = qty(holtz2023).closest('li')!;
    expect(within(row).getByText('2023')).toBeVisible();
    expect(within(row).getByText('Mosel')).toHaveClass('text-muted');
    expect(within(row).getByText('750 ml')).toBeVisible();
    expect(within(row).getByText('HOL-RI-23-750')).toBeVisible();
    expect(within(row).getByText('5 available')).toHaveClass('text-warning');
    expect(screen.getByText('120 available')).toHaveClass('text-success');
    expect(screen.getAllByText('Out of stock')[0]).toHaveClass('text-danger');
  });

  it('shows NV with an accessible expansion and labels the input Non-vintage', () => {
    setup('strict');
    const input = qty('Quantity for Bellerive Rosato Non-vintage, 750 ml');
    const abbr = within(input.closest('li')!).getByText('NV');
    expect(abbr).toHaveAttribute('title', 'Non-vintage');
  });

  it('filters to one producer', async () => {
    const user = setup('strict');
    await user.selectOptions(screen.getByLabelText('Show'), 'Domaine Aubert');
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent),
    ).toEqual(['Domaine Aubert']);
    await user.selectOptions(screen.getByLabelText('Show'), '');
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(
      1,
    );
  });

  it('offers All producers first, then producers alphabetically', () => {
    setup('strict');
    const options = within(screen.getByLabelText('Show'))
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options[0]).toBe('All producers');
    expect(options[1]).toBe('Bellerive');
    expect(options.slice(1)).toEqual(
      [...options.slice(1)].sort((a, b) => a.localeCompare(b)),
    );
  });

  it('shows the empty state when there are no wines', () => {
    setup('strict', []);
    expect(screen.getByText('No wines to show.')).toBeVisible();
  });
});

describe('WineSection quantities', () => {
  it('puts a wine in the request when typing, dropping non-digits and zeros', async () => {
    const user = setup('flexible');
    const input = qty(holtz2023);
    await user.type(input, '0a3');
    expect(input).toHaveValue('3');
    expect(screen.getByText('Within stock')).toBeVisible();
    expect(input.closest('li')).toHaveClass('bg-success-soft');
    expect(
      qty(/Holtz Estate Riesling Kabinett 2022/).closest('li'),
    ).not.toHaveClass('bg-success-soft');
  });

  it('keeps the line with an empty quantity when cleared', async () => {
    const user = setup('flexible');
    const input = qty(holtz2023);
    await user.type(input, '3');
    await user.clear(input);
    expect(screen.getByText('Enter a quantity')).toBeVisible();
    expect(input.closest('li')).toHaveClass('bg-warning-soft');
  });

  it('describes the input by its status', async () => {
    const user = setup('flexible');
    const input = qty(holtz2023);
    await user.type(input, '3');
    expect(input).toHaveAccessibleDescription('Within stock');
  });

  it('flags a bad quantity as invalid', async () => {
    const user = setup('flexible');
    const input = qty(holtz2023);
    await user.type(input, '1000');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByText('Quantity must be a whole number from 1 to 999.'),
    ).toBeVisible();
  });

  it('under flexible, zero stock accepts input and shows Short by N', async () => {
    const user = setup('flexible');
    const input = qty(aubrey1500);
    expect(input).toBeEnabled();
    await user.type(input, '4');
    expect(
      screen.getByText('Short by 4 — kept, flagged for reviewer'),
    ).toBeVisible();
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('under strict, zero stock is disabled with a reason', () => {
    setup('strict');
    expect(qty(aubrey1500)).toBeDisabled();
    expect(qty(aubrey1500)).toHaveAccessibleDescription(
      "Can't order — out of stock (strict)",
    );
  });

  it('under strict, over-stock is an error and Set to M fixes it', async () => {
    const user = setup('strict');
    const input = qty(holtz2023);
    await user.type(input, '8');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Over stock by 3 — max 5 (strict)')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Set to 5' }));
    expect(input).toHaveValue('5');
    expect(screen.getByText('Within stock')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /Set to/ }),
    ).not.toBeInTheDocument();
  });

  it('does not offer Set to under flexible', async () => {
    const user = setup('flexible');
    await user.type(qty(holtz2023), '8');
    expect(
      screen.queryByRole('button', { name: /Set to/ }),
    ).not.toBeInTheDocument();
  });
});

describe('WineSection row level colour', () => {
  it('has no tint until the wine is in the request, then follows the level', async () => {
    const user = setup('strict');
    const row = () => qty(holtz2023).closest('li');
    expect(row()).toHaveClass('border-transparent');
    await user.type(qty(holtz2023), '1');
    expect(row()).toHaveClass('border-success', 'bg-success-soft');
    await user.clear(qty(holtz2023));
    expect(row()).toHaveClass('border-warning', 'bg-warning-soft');
    await user.type(qty(holtz2023), '999');
    expect(row()).toHaveClass('border-danger', 'bg-danger-soft');
  });
});
