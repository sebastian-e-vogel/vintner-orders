import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ErrorPage from './error';

describe('Error boundary', () => {
  it('shows a message and calls retry when the button is clicked', async () => {
    const retry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorPage error={new Error('boom')} retry={retry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
