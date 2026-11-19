import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PolicyBadge } from './PolicyBadge';

describe('PolicyBadge', () => {
  it('shows the label with the colours of its policy', () => {
    render(<PolicyBadge policy="flexible">Flexible policy</PolicyBadge>);

    expect(screen.getByText('Flexible policy')).toHaveClass(
      'bg-flexible-soft',
      'text-flexible',
    );
  });
});
