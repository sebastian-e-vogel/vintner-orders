import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Select } from './Select';

describe('Select', () => {
  it('passes native props and children through', () => {
    render(
      <Select aria-label="Customer" defaultValue="b">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );
    expect(screen.getByLabelText('Customer')).toHaveValue('b');
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('keeps its own classes next to a custom one', () => {
    render(<Select aria-label="Customer" className="extra" />);
    expect(screen.getByLabelText('Customer')).toHaveClass('border', 'extra');
  });
});
