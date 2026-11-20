import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SettingsError from './error';

describe('Settings error boundary', () => {
  it('shows an alert and calls retry', async () => {
    const retry = vi.fn();
    const user = userEvent.setup();
    render(<SettingsError error={new Error('boom')} retry={retry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('could not be loaded');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
