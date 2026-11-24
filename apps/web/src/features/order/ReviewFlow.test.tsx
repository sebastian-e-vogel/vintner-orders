import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { customersFixture } from '@/fixtures/customers';
import { winesFixture } from '@/fixtures/wines';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { NewOrderDraft } from './NewOrderDraft';
import type { OnSave, SaveResult } from './saveResult';

const replace = vi.fn();
Element.prototype.scrollIntoView = vi.fn();
window.matchMedia = vi.fn(() => ({ matches: false })) as never;
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

beforeEach(() => replace.mockClear());

const [bellavista] = customersFixture;
const wineId = winesFixture[0].id;
const secondId = winesFixture[2].id;

const savedRequest = {
  id: '11111111-1111-4111-8111-111111111111',
  createdAt: '2026-11-24T15:30:00.000Z',
  policy: 'strict' as const,
  lines: [{ wineId, quantity: 6, available: 48, shortBy: 0 }],
  duplicate: false,
};
const saved: SaveResult = { status: 'saved', request: savedRequest };

function setup(
  onSave?: OnSave,
  { policy = 'strict', customerId = bellavista.id } = {} as {
    policy?: InventoryPolicy;
    customerId?: string;
  },
) {
  render(
    <NewOrderDraft
      customers={customersFixture}
      customerId={customerId}
      wines={winesFixture}
      recentWines={[]}
      policy={policy}
      onSave={onSave}
    />,
  );
  return userEvent.setup();
}

const quantity = (id = wineId) =>
  document.getElementById(`quantity-${id}`) as HTMLInputElement;
const reviewButton = () =>
  screen.getByRole('button', { name: /Review and save|Retry save/ });
const saveButton = () =>
  screen.getByRole('button', { name: 'Caller confirmed — save request' });

async function fillValid(user: ReturnType<typeof userEvent.setup>, qty = '6') {
  await user.type(screen.getByLabelText('Caller name'), 'Marco Rossi');
  await user.type(screen.getByLabelText('Caller phone'), '+44 20 7946 0101');
  await user.type(quantity(), qty);
}

async function openReview(user: ReturnType<typeof userEvent.setup>, qty = '6') {
  await fillValid(user, qty);
  await user.click(reviewButton());
}

describe('review checks', () => {
  it('stops an invalid draft, focuses the summary and goes to each target', async () => {
    const user = setup(vi.fn());
    await user.click(reviewButton());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const summary = screen.getByRole('group', {
      name: 'Before you can save, fix these 3 things:',
    });
    expect(summary).toHaveFocus();
    // The field errors show too.
    expect(screen.getByLabelText('Caller name')).toBeInvalid();

    await user.click(
      within(summary).getByRole('button', { name: "Enter the caller's name." }),
    );
    expect(screen.getByLabelText('Caller name')).toHaveFocus();
    await user.click(
      within(summary).getByRole('button', { name: 'Add at least one wine.' }),
    );
    expect(screen.getByLabelText('Show')).toHaveFocus();
  });

  it('updates the errors as the rep fixes them', async () => {
    const user = setup(vi.fn());
    await user.click(reviewButton());
    await user.type(screen.getByLabelText('Caller name'), 'Marco');
    expect(screen.getByLabelText('Caller name')).toBeValid();
    expect(
      screen.getByRole('group', {
        name: 'Before you can save, fix these 2 things:',
      }),
    ).toBeInTheDocument();
  });

  it('goes to a blocking wine through its quantity', async () => {
    const user = setup(vi.fn());
    await user.type(screen.getByLabelText('Caller name'), 'Marco');
    await user.type(screen.getByLabelText('Caller phone'), '1234567');
    await user.type(quantity(), '99');
    await user.click(reviewButton());
    await user.click(
      screen.getByRole('button', { name: /Domaine Aubert.*Over stock/ }),
    );
    expect(quantity()).toHaveFocus();
  });

  it('asks for a customer and checks the note length', async () => {
    const user = setup(vi.fn(), { customerId: '' });
    await fillValid(user);
    await user.click(screen.getByLabelText(/Note for the reviewer/));
    await user.paste('a'.repeat(501));
    await user.click(reviewButton());
    const summary = screen.getByRole('group', { name: /fix these 2 things/ });
    await user.click(
      within(summary).getByRole('button', {
        name: 'Notes can be at most 500 characters.',
      }),
    );
    expect(screen.getByLabelText(/Note for the reviewer/)).toHaveFocus();
    await user.click(
      within(summary).getByRole('button', { name: 'Choose a customer.' }),
    );
    expect(screen.getByLabelText('Customer')).toHaveFocus();
  });
});

describe('review dialog', () => {
  it('reads the request back and focuses the save button', async () => {
    const user = setup(vi.fn());
    await user.type(screen.getByLabelText('Caller name'), ' Marco ');
    await user.type(screen.getByLabelText('Caller phone'), '1234567');
    await user.type(quantity(), '6');
    await user.click(screen.getByLabelText(/Note for the reviewer/));
    await user.paste('Deliver early');
    await user.click(reviewButton());
    const dialog = screen.getByRole('dialog', {
      name: 'Read back to the caller',
    });
    expect(
      within(dialog).getByText('Bellavista Trattoria'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Marco')).toBeInTheDocument();
    expect(within(dialog).getByText('Deliver early')).toBeInTheDocument();
    expect(within(dialog).getByRole('listitem')).toHaveTextContent(
      /6.*Domaine Aubert/,
    );
    expect(saveButton()).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Back to edit' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(quantity()).toHaveValue('6');
  });

  it('flags a flexible shortage in the read-back', async () => {
    const user = setup(vi.fn(), { policy: 'flexible' });
    await openReview(user, '60');
    expect(screen.getByText('Short by 12')).toBeInTheDocument();
  });

  it('cannot save yet without an onSave', async () => {
    const user = setup();
    await openReview(user);
    expect(saveButton()).toBeDisabled();
    expect(
      screen.getByText('Saving is not connected yet.'),
    ).toBeInTheDocument();
  });

  it('opens with Ctrl+Enter from anywhere and ignores it while open', async () => {
    const user = setup(vi.fn());
    await fillValid(user);
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('shows the invalid-draft summary from the shortcut too', async () => {
    const user = setup(vi.fn());
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: /Before you can save/ }),
    ).toHaveFocus();
  });
});

describe('saving', () => {
  it('calls onSave once, locks the dialog and ignores Esc while pending', async () => {
    let finish: (result: SaveResult) => void = () => {};
    const onSave = vi.fn<OnSave>(
      () => new Promise((resolve) => (finish = resolve)),
    );
    const user = setup(onSave);
    await openReview(user);
    await user.dblClick(saveButton());
    await user.keyboard('{Enter}{Escape}');
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave.mock.calls[0][0]).toMatchObject({
      customerId: bellavista.id,
      lines: [{ wineId, quantity: 6 }],
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Back to edit' })).toBeDisabled();
    expect(screen.getByText(/Stay on the line/)).toBeInTheDocument();
    finish(saved);
    await screen.findByText('Request saved');
  });
});

describe('outcomes', () => {
  it('saved: shows the details, clears the draft and starts the next order', async () => {
    const onSave = vi.fn<OnSave>().mockResolvedValue(saved);
    const user = setup(onSave);
    await openReview(user);
    await user.click(saveButton());
    const dialog = await screen.findByRole('dialog', { name: 'Request saved' });
    expect(dialog).toHaveTextContent('Bellavista Trattoria');
    expect(dialog).toHaveTextContent('1 wine, 6 bottles');
    expect(dialog).toHaveTextContent('Strict policy');
    expect(dialog).toHaveTextContent('no stock is reserved');
    expect(dialog).not.toHaveTextContent('no second copy');
    expect(
      screen.getByRole('link', { name: 'View saved requests' }),
    ).toHaveAttribute('href', '/requests');
    // The draft is already empty behind the dialog.
    expect(screen.getByLabelText('Caller name')).toHaveValue('');
    expect(quantity()).toHaveValue('');
    expect(replace).toHaveBeenCalledWith('/', { scroll: false });
    expect(
      screen.getByRole('button', { name: 'Start next order' }),
    ).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Start next order' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Customer')).toHaveFocus();
  });

  it('saved: closing with Esc leaves the form empty', async () => {
    const user = setup(vi.fn<OnSave>().mockResolvedValue(saved));
    await openReview(user);
    await user.click(saveButton());
    await screen.findByText('Request saved');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Caller phone')).toHaveValue('');
  });

  it('duplicate: says the first attempt had already saved', async () => {
    const user = setup(
      vi.fn<OnSave>().mockResolvedValue({
        status: 'saved',
        request: { ...savedRequest, duplicate: true },
      }),
    );
    await openReview(user);
    await user.click(saveButton());
    expect(
      await screen.findByText(/no second copy was made/),
    ).toBeInTheDocument();
  });

  it('could not confirm: keeps everything, locks the draft and retries with the same key', async () => {
    const onSave = vi
      .fn<OnSave>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ status: 'error' })
      .mockResolvedValueOnce(saved);
    const user = setup(onSave);
    await openReview(user);
    await user.click(saveButton());
    await screen.findByText("We couldn't confirm the save");
    expect(
      screen.getByText(/may or may not have been saved/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry save' })).toHaveFocus();

    await user.click(
      screen.getByRole('button', { name: 'Close (keep order)' }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Caller name')).toBeDisabled();
    expect(quantity()).toBeDisabled();
    expect(screen.getByLabelText(/Note for the reviewer/)).toBeDisabled();
    expect(screen.getByLabelText('Caller name')).toHaveValue('Marco Rossi');
    expect(screen.getByText(/request is locked/)).toBeInTheDocument();

    // Retry from the panel reopens the dialog, and the second miss keeps the lock.
    await user.click(screen.getByRole('button', { name: /Retry save/ }));
    await user.click(screen.getByRole('button', { name: 'Retry save' }));
    await screen.findByText("We couldn't confirm the save");
    await user.click(screen.getByRole('button', { name: 'Retry save' }));
    await screen.findByText('Request saved');

    const keys = onSave.mock.calls.map(([, key]) => key);
    expect(new Set(keys).size).toBe(1);
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/);
    expect(screen.getByLabelText('Caller name')).toBeEnabled();
  });

  it('uses a new key for the next draft after an answer', async () => {
    const onSave = vi.fn<OnSave>().mockResolvedValue({
      status: 'invalid',
      fieldErrors: { phone: 'Phone needs at least 7 digits.' },
    });
    const user = setup(onSave);
    await openReview(user);
    await user.click(saveButton());
    expect(
      await screen.findByText('Phone needs at least 7 digits.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Your order is kept/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to edit' }));
    expect(screen.getByLabelText('Caller name')).toHaveValue('Marco Rossi');
    await user.click(reviewButton());
    await user.click(saveButton());
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave.mock.calls[0][1]).not.toBe(onSave.mock.calls[1][1]);
  });

  it.each([
    [
      'unknown customer',
      { status: 'rejected', rejection: { reason: 'unknown_customer' } },
      /customer no longer exists/,
    ],
    [
      'unknown wines',
      {
        status: 'rejected',
        rejection: { reason: 'unknown_wines', wineIds: [wineId, 'gone'] },
      },
      /Remove them from the request/,
    ],
    [
      'key reused',
      { status: 'rejected', rejection: { reason: 'idempotency_key_reused' } },
      /Nothing was saved, so save it again/,
    ],
  ] as [string, SaveResult, RegExp][])(
    '%s: explains it and goes back to edit',
    async (_name, result, message) => {
      const user = setup(vi.fn<OnSave>().mockResolvedValue(result));
      await openReview(user);
      await user.click(saveButton());
      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Back to edit' }),
      ).toHaveFocus();
      await user.click(screen.getByRole('button', { name: 'Back to edit' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Caller name')).toHaveValue('Marco Rossi');
    },
  );

  it('unknown wines: names them from the catalog, and unlisted ones too', async () => {
    const user = setup(
      vi.fn<OnSave>().mockResolvedValue({
        status: 'rejected',
        rejection: { reason: 'unknown_wines', wineIds: [wineId, 'gone'] },
      }),
    );
    await openReview(user);
    await user.click(saveButton());
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('A wine that is no longer listed');
    expect(dialog).toHaveTextContent(
      'Domaine Aubert Pinot Noir Reserve 2021, 750 ml',
    );
  });

  it('over stock: names the policy and goes to the first short wine', async () => {
    const onSave = vi.fn<OnSave>().mockResolvedValue({
      status: 'rejected',
      rejection: {
        reason: 'over_stock',
        policy: 'strict',
        lines: [
          { wineId: secondId, quantity: 2, available: 2, shortBy: 0 },
          { wineId, quantity: 6, available: 4, shortBy: 2 },
        ],
      },
    });
    const user = setup(onSave, { policy: 'flexible' });
    await openReview(user);
    await user.click(saveButton());
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Strict policy');
    expect(dialog).toHaveTextContent(
      'Domaine Aubert Pinot Noir Reserve 2021, 750 ml: requested 6, 4 available',
    );
    expect(dialog).not.toHaveTextContent('requested 2, 2');
    await user.click(screen.getByRole('button', { name: 'Fix quantities' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(quantity()).toHaveFocus();
  });
});
