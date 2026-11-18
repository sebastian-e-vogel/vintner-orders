import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('Home page', () => {
  it('renders the heading', () => {
    render(<Home />);
    expect(
      screen.getByRole('heading', { name: 'Vintner Orders', level: 1 }),
    ).toBeInTheDocument();
  });

  it('supports user-event interactions', async () => {
    const user = userEvent.setup();
    render(<input aria-label="name" />);
    const input = screen.getByLabelText('name');
    await user.type(input, 'Rioja');
    expect(input).toHaveValue('Rioja');
  });
});
