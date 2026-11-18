import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

const pathname = vi.hoisted(() => ({ current: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }));

describe('Header navigation', () => {
  beforeEach(() => {
    pathname.current = '/';
  });

  it('shows the app name and the three links', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New order' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(
      screen.getByRole('link', { name: 'Saved requests' }),
    ).toHaveAttribute('href', '/requests');
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/settings',
    );
  });

  it.each([
    ['/', 'New order'],
    ['/requests', 'Saved requests'],
    ['/settings', 'Settings'],
  ])('marks only the current link on %s', (path, name) => {
    pathname.current = path;
    render(<Header />);
    const current = screen.getAllByRole('link', { current: 'page' });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName(name);
  });

  it('marks no link on an unknown path', () => {
    pathname.current = '/nope';
    render(<Header />);
    expect(screen.queryByRole('link', { current: 'page' })).toBeNull();
  });
});
