import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RequestsLoading from './loading';

describe('Requests loading state', () => {
  it('keeps the heading and announces loading with a screen-reader-only label', () => {
    const { container } = render(<RequestsLoading />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Saved requests' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading saved requests',
    );
    expect(screen.getByText('Loading saved requests')).toHaveClass('sr-only');
    expect(container.querySelector('[aria-hidden="true"]')).toHaveClass(
      'animate-spin',
    );
  });
});
