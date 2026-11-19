import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Loading from './loading';

describe('Route loading state', () => {
  it('announces loading with a screen-reader-only label and no visible text', () => {
    const { container } = render(<Loading />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(screen.getByText('Loading')).toHaveClass('sr-only');
    expect(container.querySelector('[aria-hidden="true"]')).toHaveClass(
      'animate-spin',
    );
  });
});
