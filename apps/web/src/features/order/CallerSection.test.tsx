import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CallerSection } from './CallerSection';
import type { CallerErrors } from './callerValidation';
import { customersFixture } from './testData';

const [bellavista] = customersFixture;

function renderSection(
  props: Partial<React.ComponentProps<typeof CallerSection>> = {},
) {
  const handlers = {
    onCustomerChange: vi.fn(),
    onNameChange: vi.fn(),
    onPhoneChange: vi.fn(),
  };
  render(
    <CallerSection
      customers={customersFixture}
      customerId=""
      name=""
      phone=""
      errors={{}}
      {...handlers}
      {...props}
    />,
  );
  return { user: userEvent.setup(), ...handlers };
}

describe('CallerSection', () => {
  it('renders the step badge, heading and three fields', () => {
    renderSection();
    expect(
      screen.getByRole('heading', { name: /Who's calling\?/ }),
    ).toBeVisible();
    expect(screen.getByLabelText('Customer').tagName).toBe('SELECT');
    expect(screen.getByLabelText('Caller name')).toHaveAttribute(
      'type',
      'text',
    );
    expect(screen.getByLabelText('Caller phone')).toHaveAttribute(
      'type',
      'tel',
    );
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('Choose a customer…');
    expect(options.slice(1).map((o) => o.textContent)).toEqual(
      customersFixture.map((c) => c.name),
    );
  });

  it('reports the chosen customer', async () => {
    const { user, onCustomerChange } = renderSection();
    await user.selectOptions(screen.getByLabelText('Customer'), bellavista.id);
    expect(onCustomerChange).toHaveBeenCalledWith(bellavista.id);
  });

  it('hides the usual contact row until a customer is selected', () => {
    renderSection();
    expect(screen.queryByText(/Usual contact/)).not.toBeInTheDocument();
  });

  it('offers the button, which fills both fields, without prefilling', async () => {
    const { user, onNameChange, onPhoneChange } = renderSection({
      customerId: bellavista.id,
    });
    expect(screen.getByText(bellavista.contactName)).toBeVisible();
    expect(onNameChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Use usual contact' }));
    expect(onNameChange).toHaveBeenCalledWith(bellavista.contactName);
    expect(onPhoneChange).toHaveBeenCalledWith(bellavista.phone);
  });

  it('shows the note instead of the button when both fields match', () => {
    renderSection({
      customerId: bellavista.id,
      name: bellavista.contactName,
      phone: bellavista.phone,
    });
    expect(screen.getByText('✓ Using usual contact')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Use usual contact' }),
    ).not.toBeInTheDocument();
  });

  it('keeps the button when only one field matches', () => {
    renderSection({
      customerId: bellavista.id,
      name: bellavista.contactName,
      phone: '123',
    });
    expect(
      screen.getByRole('button', { name: 'Use usual contact' }),
    ).toBeVisible();
  });

  it('links the phone help text, and no error when valid', () => {
    renderSection();
    const phone = screen.getByLabelText('Caller phone');
    expect(phone).toHaveAttribute('aria-invalid', 'false');
    expect(phone).toHaveAccessibleDescription(/At least 7 digits/);
    expect(screen.getByLabelText('Caller name')).not.toHaveAttribute(
      'aria-describedby',
    );
  });

  it('marks each invalid field and links its message', () => {
    const errors: CallerErrors = {
      customer: 'Choose a customer.',
      name: 'Enter the name of the person calling.',
      phone: 'Phone number needs at least 7 digits.',
    };
    renderSection({ errors });
    for (const [label, message] of [
      ['Customer', errors.customer],
      ['Caller name', errors.name],
      ['Caller phone', errors.phone],
    ]) {
      const field = screen.getByLabelText(label as string);
      expect(field).toHaveAttribute('aria-invalid', 'true');
      expect(field).toHaveAccessibleDescription(
        expect.stringContaining(message as string),
      );
    }
    // The phone field is described by both its help text and its error.
    expect(screen.getByLabelText('Caller phone')).toHaveAccessibleDescription(
      /At least 7 digits\. Phone number needs/,
    );
  });

  it('explains that there are no customers and disables the select', () => {
    renderSection({ customers: [] });
    const select = screen.getByLabelText('Customer');
    expect(select).toBeDisabled();
    expect(
      screen.getByRole('option', { name: 'No customers available' }),
    ).toBeInTheDocument();
    expect(select).toHaveAccessibleDescription(/no customers yet/);
  });
});
