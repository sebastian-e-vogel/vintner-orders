import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('hides the circle from assistive tech and exposes the label as screen-reader text', () => {
    const { container } = render(<Spinner label="Applying" />);
    expect(screen.getByText('Applying')).toHaveClass('sr-only');
    expect(container.querySelector('[aria-hidden="true"]')).toHaveClass(
      'animate-spin',
      'motion-reduce:animate-none',
    );
  });

  it('renders without a label', () => {
    render(<Spinner />);
    expect(screen.queryByText(/./)).not.toBeInTheDocument();
  });
});
