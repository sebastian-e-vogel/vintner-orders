import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { customersFixture } from '@/fixtures/customers';
import { lastTimeFixture } from '@/fixtures/lastTime';
import { winesFixture } from '@/fixtures/wines';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { NewOrderDraft } from './NewOrderDraft';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

const [bellavista, harbour, lindqvist] = customersFixture;

function renderCaller(customerId = '', policy: InventoryPolicy = 'strict') {
  const view = render(
    <NewOrderDraft
      customers={customersFixture}
      customerId={customerId}
      wines={winesFixture}
      policy={policy}
      lastTime={lastTimeFixture[customerId]}
    />,
  );
  const rerenderWith = (id: string) =>
    view.rerender(
      <NewOrderDraft
        customers={customersFixture}
        customerId={id}
        wines={winesFixture}
        policy={policy}
        lastTime={lastTimeFixture[id]}
      />,
    );
  return { user: userEvent.setup(), rerenderWith };
}

const nameField = () => screen.getByLabelText('Caller name');
const phoneField = () => screen.getByLabelText('Caller phone');

describe('NewOrderDraft', () => {
  beforeEach(() => replace.mockClear());

  it('puts the chosen customer in the URL without scrolling', async () => {
    const { user } = renderCaller();
    await user.selectOptions(screen.getByLabelText('Customer'), harbour.id);
    expect(replace).toHaveBeenCalledWith(`/?customer=${harbour.id}`, {
      scroll: false,
    });
  });

  it('clears the param when the placeholder is chosen', async () => {
    const { user } = renderCaller(harbour.id);
    await user.selectOptions(screen.getByLabelText('Customer'), '');
    expect(replace).toHaveBeenCalledWith('/', { scroll: false });
  });

  it('fills both fields from the button and then shows the note', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.click(screen.getByRole('button', { name: 'Use usual contact' }));
    expect(nameField()).toHaveValue(bellavista.contactName);
    expect(phoneField()).toHaveValue(bellavista.phone);
    expect(screen.getByText('✓ Using usual contact')).toBeVisible();
  });

  it('clears both fields when both hold the previous usual contact', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.click(screen.getByRole('button', { name: 'Use usual contact' }));
    await user.selectOptions(screen.getByLabelText('Customer'), harbour.id);
    expect(nameField()).toHaveValue('');
    expect(phoneField()).toHaveValue('');
  });

  it('keeps values the rep typed on customer change', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.type(nameField(), 'Someone Else');
    await user.type(phoneField(), '5551234567');
    await user.selectOptions(screen.getByLabelText('Customer'), harbour.id);
    expect(nameField()).toHaveValue('Someone Else');
    expect(phoneField()).toHaveValue('5551234567');
  });

  it('keeps both fields when only one matches the previous usual contact', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.type(nameField(), bellavista.contactName);
    await user.type(phoneField(), '5551234567');
    await user.selectOptions(screen.getByLabelText('Customer'), harbour.id);
    expect(nameField()).toHaveValue(bellavista.contactName);
    expect(phoneField()).toHaveValue('5551234567');
  });

  it('shows the new usual contact once the URL selects another customer', async () => {
    const { rerenderWith } = renderCaller(bellavista.id);
    rerenderWith(harbour.id);
    expect(screen.getByText(harbour.contactName)).toBeVisible();
  });
});

const qty = (name: RegExp) => screen.getByRole('textbox', { name });
const catalogStatus = () => screen.getAllByRole('status').at(-1)!;

describe('NewOrderDraft last time', () => {
  it('shows no card until a customer is selected', () => {
    renderCaller();
    expect(screen.queryByText('Last time')).not.toBeInTheDocument();
  });

  it('shows the latest pending request for a customer', () => {
    renderCaller(harbour.id);
    expect(screen.getByText('Saved request · pending review')).toBeVisible();
  });

  it('shows the empty state for a customer without history', () => {
    renderCaller(lindqvist.id);
    expect(
      screen.getByText(/No previous orders or saved requests for Lindqvist/),
    ).toBeVisible();
  });

  it('adds one wine without a quantity, announces it and does not move focus', async () => {
    const { user } = renderCaller(bellavista.id);
    const add = screen.getByRole('button', { name: /^Add .*Brunello.*2020/ });
    await user.click(add);
    expect(
      qty(/Quantity for Bellerive Brunello di Montalcino 2020/),
    ).toHaveValue('');
    expect(screen.getAllByText('Enter a quantity')[0]).toHaveClass(
      'text-foreground',
    );
    expect(catalogStatus()).toHaveTextContent(
      'Added Bellerive Brunello di Montalcino 2020, 750 ml. Type the quantity.',
    );
    expect(screen.getByText('In request', { selector: 'span' })).toBeVisible();
    expect(add).not.toHaveFocus();
  });

  it('adds all under strict, skipping the blocked and missing wines', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.click(screen.getByRole('button', { name: 'Add 3 wines' }));
    expect(catalogStatus()).toHaveTextContent(
      "Added 3 wines from last time. Type the quantities. 2 can't be added.",
    );
    expect(
      screen.getByRole('button', { name: 'Nothing more to add' }),
    ).toBeDisabled();
  });

  it('adds all under flexible, including the out-of-stock wine', async () => {
    const { user } = renderCaller(bellavista.id, 'flexible');
    await user.click(screen.getByRole('button', { name: 'Add 4 wines' }));
    expect(catalogStatus()).toHaveTextContent(
      "Added 4 wines from last time. Type the quantities. 1 can't be added.",
    );
  });

  it('mentions wines that were already in the request, and keeps their quantity', async () => {
    const { user } = renderCaller(bellavista.id, 'flexible');
    const input = qty(/Quantity for Bellerive Brunello di Montalcino 2020/);
    await user.type(input, '7');
    await user.click(screen.getByRole('button', { name: 'Add 3 wines' }));
    expect(input).toHaveValue('7');
    expect(catalogStatus()).toHaveTextContent(
      "Added 3 wines from last time. Type the quantities. 1 already in the request, 1 can't be added.",
    );
  });

  it('keeps only the latest message', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.click(screen.getByRole('button', { name: 'Add 3 wines' }));
    await user.click(screen.getAllByRole('button', { name: /Last time: / })[0]);
    expect(catalogStatus()).toHaveTextContent(/Added 3 wines/);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('the Last time hint sets the quantity and adds the line', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.click(
      screen.getByRole('button', {
        name: /Last time: 12 for Bellerive Brunello di Montalcino 2020/,
      }),
    );
    expect(
      qty(/Quantity for Bellerive Brunello di Montalcino 2020/),
    ).toHaveValue('12');
    expect(screen.getByText('Within stock')).toBeVisible();
  });

  it('hides the hint on a strict-blocked row but shows it under flexible', () => {
    renderCaller(bellavista.id, 'strict');
    expect(
      screen.queryByRole('button', { name: /Last time: 3 for .*Aubrey/ }),
    ).not.toBeInTheDocument();
  });

  it('shows the hint for the out-of-stock wine under flexible', () => {
    renderCaller(bellavista.id, 'flexible');
    expect(
      screen.getByRole('button', { name: /Last time: 3 for Domaine Aubrey/ }),
    ).toBeVisible();
  });

  it('shows a hint only for wines in last time, and not for the strict-blocked one', () => {
    renderCaller(bellavista.id);
    expect(
      screen.getAllByRole('button', { name: /^Last time: / }),
    ).toHaveLength(3);
  });
});
