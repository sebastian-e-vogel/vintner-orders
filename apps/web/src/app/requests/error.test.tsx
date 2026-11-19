import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RequestsError from './error';

describe('Requests error boundary', () => {
  it('shows an alert and calls retry', async () => {
    const retry = vi.fn();
    const user = userEvent.setup();
    render(<RequestsError error={new Error('boom')} retry={retry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('could not be loaded');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
