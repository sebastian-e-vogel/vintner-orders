import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('is labelled by its title and opens through the ref', () => {
    const ref = createRef<HTMLDialogElement>();
    render(
      <Dialog ref={ref} labelledBy="t">
        <h2 id="t">Title</h2>
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    ref.current?.showModal();
    expect(screen.getByRole('dialog', { name: 'Title' })).toBeVisible();
  });

  it('calls onCancel on Esc', async () => {
    const onCancel = vi.fn();
    const ref = createRef<HTMLDialogElement>();
    render(
      <Dialog ref={ref} labelledBy="t" onCancel={onCancel}>
        <h2 id="t">Title</h2>
        <button>Ok</button>
      </Dialog>,
    );
    ref.current?.showModal();
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
