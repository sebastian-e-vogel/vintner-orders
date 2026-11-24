import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SavedRequestList } from './SavedRequestList';
import type { SavedRequest } from './savedRequest';

const base: SavedRequest = {
  id: 'R-1',
  savedAt: '2026-11-10T09:00:00.000Z',
  customer: 'Cellar Door',
  usualContact: 'Ana Lopez',
  contactName: 'Ana Lopez',
  phone: '555-0101',
  salesRepName: 'Rosa Vega',
  policy: 'strict',
  lines: [
    {
      id: 'a',
      producer: 'Domaine X',
      wine: 'Rouge',
      region: 'Rhone',
      vintage: 2019,
      size: '750 ml',
      requested: 6,
      availableAtSave: 6,
      shortBy: 0,
    },
  ],
};

const newer: SavedRequest = {
  ...base,
  id: 'R-2',
  savedAt: '2026-11-12T15:30:00.000Z',
  customer: 'Bistro Nord',
  contactName: 'Tom Berg',
  usualContact: 'Ana Lopez',
  policy: 'flexible',
  note: 'Deliver before Friday',
  lines: [
    {
      ...base.lines[0],
      id: 'b',
      requested: 10,
      availableAtSave: 4,
      shortBy: 6,
    },
    { ...base.lines[0], id: 'c', wine: 'Blanc', requested: 2, vintage: null },
  ],
};

describe('SavedRequestList', () => {
  it('lists requests in the given order with count, lines and shortage', () => {
    render(<SavedRequestList requests={[newer, base]} />);

    expect(screen.getByRole('status')).toHaveTextContent('2 requests');
    const articles = screen.getAllByRole('article');
    expect(
      articles.map((a) => within(a).getByRole('heading').textContent),
    ).toEqual(['Bistro Nord', 'Cellar Door']);

    const first = within(articles[0]);
    expect(first.getByText('1 short at save')).toBeInTheDocument();
    expect(first.getByText('Short by 6')).toBeInTheDocument();
    expect(first.getByText('(usual: Ana Lopez)')).toBeInTheDocument();
    expect(first.getByText('Rosa Vega')).toBeInTheDocument();
    expect(first.getByText('NV')).toBeInTheDocument();
    expect(first.getAllByText('Rhone')).toHaveLength(2);
    expect(first.getByText('Flexible policy')).toBeInTheDocument();
    expect(first.getByText('Deliver before Friday')).toBeInTheDocument();
    expect(first.getByText(/bottles in 2 wines/)).toBeInTheDocument();

    const second = within(articles[1]);
    expect(second.queryByText(/short at save/)).not.toBeInTheDocument();
    expect(second.getByText('Within stock (6)')).toBeInTheDocument();
    expect(second.queryByText(/usual:/)).not.toBeInTheDocument();
    expect(second.queryByText('Note for the reviewer')).not.toBeInTheDocument();
    expect(second.getByText(/bottles in 1 wine$/)).toBeInTheDocument();
  });

  it('keeps the API order instead of sorting by date', () => {
    render(<SavedRequestList requests={[base, newer]} />);
    const headings = screen.getAllByRole('heading').map((h) => h.textContent);
    expect(headings).toEqual(['Cellar Door', 'Bistro Nord']);
  });

  it('uses the singular for one request', () => {
    render(<SavedRequestList requests={[base]} />);
    expect(screen.getByRole('status')).toHaveTextContent(/^1 request$/);
  });

  it('shows the empty state with a link to a new request', () => {
    render(<SavedRequestList requests={[]} />);

    expect(screen.getByRole('status')).toHaveTextContent('0 requests');
    expect(
      screen.getByRole('heading', { name: 'No saved requests yet' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'New order request' }),
    ).toHaveAttribute('href', '/');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});
