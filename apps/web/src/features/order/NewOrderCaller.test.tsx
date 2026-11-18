import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { customersFixture } from '@/fixtures/customers';
import { NewOrderCaller } from './NewOrderCaller';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

const [bellavista, harbour] = customersFixture;

function renderCaller(customerId = '') {
  const view = render(
    <NewOrderCaller customers={customersFixture} customerId={customerId} />,
  );
  const rerenderWith = (id: string) =>
    view.rerender(
      <NewOrderCaller customers={customersFixture} customerId={id} />,
    );
  return { user: userEvent.setup(), rerenderWith };
}

const nameField = () => screen.getByLabelText('Caller name');
const phoneField = () => screen.getByLabelText('Caller phone');

describe('NewOrderCaller', () => {
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
