import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { ReviewButton } from './ReviewButton';

afterEach(() => vi.restoreAllMocks());

it('shows Ctrl+Enter off Mac and Cmd+Enter on Mac', () => {
  const { unmount } = render(<ReviewButton label="Go" onClick={vi.fn()} />);
  expect(screen.getByText('Ctrl+↵')).toBeInTheDocument();
  unmount();
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
    'Mozilla (Macintosh)',
  );
  render(<ReviewButton label="Go" onClick={vi.fn()} />);
  expect(screen.getByText('⌘↵')).toBeInTheDocument();
});

it('renders no hint on the server so hydration matches', () => {
  expect(
    renderToString(<ReviewButton label="Go" onClick={vi.fn()} />),
  ).not.toContain('<kbd');
});
