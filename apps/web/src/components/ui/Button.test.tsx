import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('is primary by default and passes native props through', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toHaveClass('bg-primary');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders the secondary variant and respects disabled', () => {
    render(
      <Button variant="secondary" disabled>
        Stop
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Stop' });
    expect(button).toHaveClass('border');
    expect(button).not.toHaveClass('bg-primary');
    expect(button).toBeDisabled();
  });

  it('shows a spinner with an accessible label while loading', () => {
    render(
      <Button disabled loadingLabel="Working">
        Save
      </Button>,
    );
    expect(screen.getByRole('button', { name: /Working/ })).toBeDisabled();
    expect(screen.getByText('Working')).toHaveClass('sr-only');
  });
});
