import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('passes native props through', () => {
    render(<Input aria-label="Phone" type="tel" defaultValue="123" />);
    const input = screen.getByLabelText('Phone');
    expect(input).toHaveAttribute('type', 'tel');
    expect(input).toHaveValue('123');
  });

  it('keeps its own classes next to a custom one', () => {
    render(<Input aria-label="Phone" className="extra" />);
    expect(screen.getByLabelText('Phone')).toHaveClass('border', 'extra');
  });
});
