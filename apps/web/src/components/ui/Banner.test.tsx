import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Banner } from './Banner';

describe('Banner', () => {
  it.each([
    ['success', 'bg-success-soft'],
    ['danger', 'bg-danger-soft'],
  ] as const)('renders its children with the %s tone', (tone, tint) => {
    render(<Banner tone={tone}>Message</Banner>);
    expect(screen.getByText('Message')).toHaveClass(tint);
  });
});
