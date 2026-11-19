import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InventoryPolicyForm, type SaveResult } from './InventoryPolicyForm';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';

const SINCE = '2026-11-02T14:30:00.000Z';
const SAVED_AT = '2026-11-18T15:05:00.000Z';

function renderForm(
  props: {
    currentPolicy?: InventoryPolicy;
    savedRequestCount?: number;
    onSave?: (policy: InventoryPolicy) => Promise<SaveResult>;
  } = {},
) {
  const onSave =
    props.onSave ??
    vi.fn(async (policy: InventoryPolicy) => ({
      policy,
      changedAt: SAVED_AT,
    }));
  render(
    <InventoryPolicyForm
      currentPolicy={props.currentPolicy ?? 'strict'}
      changedAt={SINCE}
      savedRequestCount={props.savedRequestCount ?? 12}
      onSave={onSave}
    />,
  );
  return { user: userEvent.setup(), onSave };
}

const openButton = () =>
  screen.getByRole('button', { name: /Change to|in use/ });
const confirmButton = () =>
  screen.getByRole('button', { name: /^Change to \w+$/ });
const dialog = () => screen.queryByRole('dialog');

async function chooseFlexibleAndOpen(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('radio', { name: /Flexible/ }));
  await user.click(openButton());
}

describe('InventoryPolicyForm', () => {
  it('shows the current policy badge and the formatted "Since" time', () => {
    renderForm({ currentPolicy: 'flexible' });
    expect(screen.getByText('Current policy:')).toBeVisible();
    expect(screen.getByText('Flexible')).toBeVisible();
    expect(
      screen.getByText('Since Monday, November 2, 2026, 2:30 PM'),
    ).toBeVisible();
  });

  it('preselects the current policy, explains both options and disables the button', () => {
    renderForm({ currentPolicy: 'flexible' });
    expect(
      screen.getByRole('group', { name: 'Applies to every rep' }),
    ).toBeVisible();
    expect(screen.getByRole('radio', { name: /Flexible/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Strict/ })).not.toBeChecked();
    expect(screen.getByText(/Over stock by N/)).toBeVisible();
    expect(screen.getByText(/Short by N/)).toBeVisible();
    expect(openButton()).toHaveTextContent('Flexible is in use');
    expect(openButton()).toBeDisabled();
  });

  it('opens a confirmation with Cancel focused and saves nothing yet', async () => {
    const { user, onSave } = renderForm();

    expect(dialog()).not.toBeInTheDocument();
    await chooseFlexibleAndOpen(user);

    expect(dialog()).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Change to Flexible?' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('Cancel closes the dialog without saving and keeps the choice', async () => {
    const { user, onSave } = renderForm();

    await chooseFlexibleAndOpen(user);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(dialog()).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: /Flexible/ })).toBeChecked();
  });

  it('Esc cancels without saving', async () => {
    const { user, onSave } = renderForm();

    await chooseFlexibleAndOpen(user);
    await user.keyboard('{Escape}');

    expect(dialog()).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('confirming saves, then shows the banner with the time', async () => {
    const { user, onSave } = renderForm();

    await chooseFlexibleAndOpen(user);
    await user.click(confirmButton());

    const banner = await screen.findByText('The policy is now Flexible.');
    expect(onSave).toHaveBeenCalledExactlyOnceWith('flexible');
    expect(banner.parentElement).toHaveTextContent(/Updated at 3:05 PM\./);
    expect(dialog()).not.toBeInTheDocument();
    expect(openButton()).toBeDisabled();
    expect(
      screen.getByText('Since Wednesday, November 18, 2026, 3:05 PM'),
    ).toBeVisible();
  });

  it('hides the success banner once another option is picked', async () => {
    const { user } = renderForm();

    await chooseFlexibleAndOpen(user);
    await user.click(confirmButton());
    await screen.findByText('The policy is now Flexible.');
    await user.click(screen.getByRole('radio', { name: /Strict/ }));

    expect(
      screen.queryByText('The policy is now Flexible.'),
    ).not.toBeInTheDocument();
  });

  it('shows an error and keeps the choice when saving fails', async () => {
    const { user } = renderForm({
      onSave: vi.fn().mockRejectedValue(new Error('boom')),
    });

    await chooseFlexibleAndOpen(user);
    await user.click(confirmButton());

    expect(await screen.findByText(/nothing has changed/)).toBeVisible();
    expect(dialog()).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Flexible/ })).toBeChecked();
    expect(openButton()).toBeEnabled();
  });

  it('disables the dialog buttons while pending and blocks a second submit', async () => {
    let finish!: () => void;
    const onSave = vi.fn(
      () =>
        new Promise<SaveResult>(
          (resolve) =>
            (finish = () =>
              resolve({ policy: 'flexible', changedAt: SAVED_AT })),
        ),
    );
    const { user } = renderForm({ onSave });

    await chooseFlexibleAndOpen(user);
    await user.click(confirmButton());

    const buttons = await screen.findAllByRole('button', { name: /Applying/ });
    buttons.forEach((button) => expect(button).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(dialog()).toBeVisible();
    expect(onSave).toHaveBeenCalledTimes(1);

    finish();
    await waitFor(() =>
      expect(screen.getByText('The policy is now Flexible.')).toBeVisible(),
    );
  });

  it('is disabled again when the user switches back to the saved policy', async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole('radio', { name: /Flexible/ }));
    expect(openButton()).toBeEnabled();
    await user.click(screen.getByRole('radio', { name: /Strict/ }));
    expect(openButton()).toBeDisabled();
  });

  it('works with the keyboard: arrows switch options and Enter opens the confirmation', async () => {
    const { user } = renderForm();

    screen.getByRole('radio', { name: /Strict/ }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: /Flexible/ })).toBeChecked();
    await user.keyboard('{Enter}');

    expect(dialog()).toBeVisible();
  });
});
