import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { RequestPanel } from './RequestPanel';
import { buildRequestLines } from './requestLines';
import type { Wine } from './wine';

const wine = (id: string, sizeMl: number, available: number): Wine => ({
  id,
  sku: id,
  producer: 'Aubert',
  wineName: 'Pinot',
  region: 'Burgundy',
  vintage: 2021,
  sizeMl,
  available,
});
const catalog = [wine('a', 750, 10), wine('b', 1500, 2)];

function setup(
  lines: Record<string, string>,
  policy: InventoryPolicy = 'strict',
  customerName?: string,
) {
  const onRemove = vi.fn();
  const onGoTo = vi.fn();
  render(
    <RequestPanel
      customerName={customerName}
      lines={buildRequestLines(catalog, lines, policy)}
      policy={policy}
      onGoTo={onGoTo}
      onRemove={onRemove}
    />,
  );
  return { onRemove, onGoTo };
}

describe('RequestPanel', () => {
  it('shows the empty state and no customer', () => {
    setup({});
    expect(screen.getByText(/Nothing here yet/)).toBeInTheDocument();
    expect(screen.getByText('No customer chosen yet')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByText('All within stock')).not.toBeInTheDocument();
  });

  it('names the customer', () => {
    setup({}, 'strict', 'Harbour Wine Bar');
    expect(screen.getByText('Harbour Wine Bar')).toBeInTheDocument();
  });

  it('gives each line a button with an accessible name that goes to its wine', async () => {
    const { onGoTo } = setup({ a: '3', b: '' });
    const list = screen.getByRole('list', { name: 'Wines in this request' });
    expect(within(list).queryByRole('link')).not.toBeInTheDocument();
    await userEvent.click(
      within(list).getByRole('button', {
        name: '3 of Aubert Pinot 2021, 750 ml. Go to its row.',
      }),
    );
    expect(onGoTo).toHaveBeenCalledWith('a');
    await userEvent.click(
      within(list).getByRole('button', {
        name: 'No quantity of Aubert Pinot 2021, 1.5 L. Go to its row.',
      }),
    );
    expect(onGoTo).toHaveBeenLastCalledWith('b');
    expect(within(list).getByText('—')).toBeInTheDocument();
  });

  it('removes a line through its button', async () => {
    const { onRemove } = setup({ a: '3' });
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Aubert Pinot 2021, 750 ml' }),
    );
    expect(onRemove).toHaveBeenCalledWith('a');
  });

  it('summarizes blocking lines and totals under strict', () => {
    setup({ a: '11', b: '2' });
    expect(screen.getByText('1 to fix before saving')).toBeInTheDocument();
    expect(screen.queryByText('All within stock')).not.toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
  });

  it('summarizes shortages under flexible', () => {
    setup({ a: '11', b: '2' }, 'flexible');
    expect(screen.getByText('1 short — will be flagged')).toBeInTheDocument();
    expect(screen.queryByText(/to fix/)).not.toBeInTheDocument();
  });

  it('says everything is within stock', () => {
    setup({ a: '10', b: '2' });
    expect(screen.getByText('All within stock')).toBeInTheDocument();
  });

  it('warns about two sizes on both lines', () => {
    setup({ a: '1', b: '1' });
    expect(screen.getAllByText(/confirm both sizes/)).toHaveLength(2);
  });

  it('links the policy badge to settings', () => {
    setup({}, 'flexible');
    expect(
      screen.getByRole('link', { name: 'Flexible policy' }),
    ).toHaveAttribute('href', '/settings');
  });
});

describe('RequestPanel line level', () => {
  const lineOf = (name: RegExp) =>
    screen.getByRole('button', { name }).closest('li');

  it('colours each line by its level', () => {
    setup({ a: '3', b: '' });
    expect(lineOf(/3 of Aubert/)).toHaveClass(
      'border-success',
      'bg-success-soft',
    );
    expect(lineOf(/No quantity of/)).toHaveClass(
      'border-warning',
      'bg-warning-soft',
    );
  });

  it('uses red only for a real error', () => {
    setup({ a: '11' });
    expect(lineOf(/11 of Aubert/)).toHaveClass(
      'border-danger',
      'bg-danger-soft',
    );
  });

  it('marks a flexible shortage as amber', () => {
    setup({ a: '11' }, 'flexible');
    expect(lineOf(/11 of Aubert/)).toHaveClass(
      'border-warning',
      'bg-warning-soft',
    );
  });
});
