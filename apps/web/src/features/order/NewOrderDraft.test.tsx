import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { customersFixture } from './testData';
import { lastTimeFixture } from '@/fixtures/lastTime';
import { winesFixture } from './testData';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { NewOrderDraft } from './NewOrderDraft';

const replace = vi.fn();
const scrollIntoView = vi.fn();
// jsdom has neither; reduced motion is off unless a test turns it on.
const matchMedia = vi.fn(() => ({ matches: false }));
Element.prototype.scrollIntoView = scrollIntoView;
window.matchMedia = matchMedia as never;
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

beforeEach(() => {
  replace.mockClear();
  scrollIntoView.mockClear();
});

const [bellavista, harbour, lindqvist] = customersFixture;

function renderCaller(customerId = '', policy: InventoryPolicy = 'strict') {
  const view = render(
    <NewOrderDraft
      customers={customersFixture}
      customerId={customerId}
      wines={winesFixture}
      recentWines={[]}
      policy={policy}
      lastTime={lastTimeFixture[customerId]}
    />,
  );
  const rerenderWith = (id: string) =>
    view.rerender(
      <NewOrderDraft
        customers={customersFixture}
        customerId={id}
        wines={winesFixture}
        recentWines={[]}
        policy={policy}
        lastTime={lastTimeFixture[id]}
      />,
    );
  return { user: userEvent.setup(), rerenderWith };
}

const nameField = () => screen.getByLabelText('Caller name');
const phoneField = () => screen.getByLabelText('Caller phone');

describe('NewOrderDraft', () => {
  it('puts the chosen customer in the URL without scrolling', async () => {
    const { user } = renderCaller();
    await user.selectOptions(screen.getByLabelText('Customer'), harbour.id);
    expect(replace).toHaveBeenCalledWith(`/?customer=${harbour.id}`, {
      scroll: false,
    });
  });

  it('clears the param when the placeholder is chosen', async () => {
    const { user } = renderCaller(harbour.id);
    await user.selectOptions(screen.getByLabelText('Customer'), '');
    expect(replace).toHaveBeenCalledWith('/', { scroll: false });
  });

  it('fills both fields from the button and then shows the note', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.click(screen.getByRole('button', { name: 'Use usual contact' }));
    expect(nameField()).toHaveValue(bellavista.contactName);
    expect(phoneField()).toHaveValue(bellavista.phone);
    expect(screen.getByText('✓ Using usual contact')).toBeVisible();
  });

  it('clears both fields when both hold the previous usual contact', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.click(screen.getByRole('button', { name: 'Use usual contact' }));
    await user.selectOptions(screen.getByLabelText('Customer'), harbour.id);
    expect(nameField()).toHaveValue('');
    expect(phoneField()).toHaveValue('');
  });

  it('keeps values the rep typed on customer change', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.type(nameField(), 'Someone Else');
    await user.type(phoneField(), '5551234567');
    await user.selectOptions(screen.getByLabelText('Customer'), harbour.id);
    expect(nameField()).toHaveValue('Someone Else');
    expect(phoneField()).toHaveValue('5551234567');
  });

  it('keeps both fields when only one matches the previous usual contact', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.type(nameField(), bellavista.contactName);
    await user.type(phoneField(), '5551234567');
    await user.selectOptions(screen.getByLabelText('Customer'), harbour.id);
    expect(nameField()).toHaveValue(bellavista.contactName);
    expect(phoneField()).toHaveValue('5551234567');
  });

  it('shows the new usual contact once the URL selects another customer', async () => {
    const { rerenderWith } = renderCaller(bellavista.id);
    rerenderWith(harbour.id);
    expect(screen.getByText(harbour.contactName)).toBeVisible();
  });
});

const qty = (name: RegExp) => screen.getByRole('textbox', { name });
const catalogStatus = () => screen.getAllByRole('status').at(-1)!;

describe('NewOrderDraft last time', () => {
  it('shows no card until a customer is selected', () => {
    renderCaller();
    expect(screen.queryByText('Last time')).not.toBeInTheDocument();
  });

  it('shows the latest pending request for a customer', () => {
    renderCaller(harbour.id);
    expect(screen.getByText('Saved request · pending review')).toBeVisible();
  });

  it('shows the empty state for a customer without history', () => {
    renderCaller(lindqvist.id);
    expect(
      screen.getByText(/No previous orders or saved requests for Lindqvist/),
    ).toBeVisible();
  });

  it('adds one wine without a quantity, announces it and goes to its quantity', async () => {
    const { user } = renderCaller(bellavista.id);
    const add = screen.getByRole('button', { name: /^Add .*Brunello.*2020/ });
    await user.click(add);
    expect(
      qty(/Quantity for Bellerive Brunello di Montalcino 2020/),
    ).toHaveValue('');
    expect(screen.getAllByText('Enter a quantity')[0]).toHaveClass(
      'text-foreground',
    );
    expect(catalogStatus()).toHaveTextContent(
      'Added Bellerive Brunello di Montalcino 2020, 750 ml. Type the quantity.',
    );
    expect(screen.getByText('In request', { selector: 'span' })).toBeVisible();
    expect(
      qty(/Quantity for Bellerive Brunello di Montalcino 2020/),
    ).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: 'center',
      behavior: 'smooth',
    });
  });

  it('clicking a last-time card already in the request goes to its row without a message', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.click(
      screen.getByRole('button', { name: /^Add .*Brunello.*2020/ }),
    );
    await user.click(screen.getByLabelText('Show'));
    await user.click(
      screen.getByRole('button', { name: /^Go to .*Brunello.*2020/ }),
    );
    expect(
      qty(/Quantity for Bellerive Brunello di Montalcino 2020/),
    ).toHaveFocus();
    expect(catalogStatus()).toBeEmptyDOMElement();
  });

  it('goes to the first wine "Add all" added and highlights every row it touched', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.click(screen.getByRole('button', { name: 'Add 3 wines' }));
    expect(
      qty(/Quantity for Bellerive Brunello di Montalcino 2020/),
    ).toHaveFocus();
    const highlighted = screen
      .getAllByRole('textbox', { name: /^Quantity for/ })
      .filter((input) =>
        input.closest('li')?.className.includes('animate-row-highlight'),
      );
    expect(highlighted).toHaveLength(3);
  });

  it('also goes through a last-time wine that was already in the request', async () => {
    const { user } = renderCaller(bellavista.id, 'flexible');
    await user.type(
      qty(/Quantity for Bellerive Brunello di Montalcino 2020/),
      '7',
    );
    await user.click(screen.getByRole('button', { name: 'Add 3 wines' }));
    expect(
      qty(/Quantity for Bellerive Brunello di Montalcino 2020/),
    ).toHaveFocus();
    const highlighted = screen
      .getAllByRole('textbox', { name: /^Quantity for/ })
      .filter((input) =>
        input.closest('li')?.className.includes('animate-row-highlight'),
      );
    expect(highlighted).toHaveLength(4);
  });

  it('adds all under strict, skipping the blocked and missing wines', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.click(screen.getByRole('button', { name: 'Add 3 wines' }));
    expect(catalogStatus()).toHaveTextContent(
      "Added 3 wines from last time. Type the quantities. 2 can't be added.",
    );
    expect(
      screen.getByRole('button', { name: 'Nothing more to add' }),
    ).toBeDisabled();
  });

  it('adds all under flexible, including the out-of-stock wine', async () => {
    const { user } = renderCaller(bellavista.id, 'flexible');
    await user.click(screen.getByRole('button', { name: 'Add 4 wines' }));
    expect(catalogStatus()).toHaveTextContent(
      "Added 4 wines from last time. Type the quantities. 1 can't be added.",
    );
  });

  it('mentions wines that were already in the request, and keeps their quantity', async () => {
    const { user } = renderCaller(bellavista.id, 'flexible');
    const input = qty(/Quantity for Bellerive Brunello di Montalcino 2020/);
    await user.type(input, '7');
    await user.click(screen.getByRole('button', { name: 'Add 3 wines' }));
    expect(input).toHaveValue('7');
    expect(catalogStatus()).toHaveTextContent(
      "Added 3 wines from last time. Type the quantities. 1 already in the request, 1 can't be added.",
    );
  });

  it('keeps only the latest message', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.click(screen.getByRole('button', { name: 'Add 3 wines' }));
    await user.click(screen.getAllByRole('button', { name: /Last time: / })[0]);
    expect(catalogStatus()).toHaveTextContent(/Added 3 wines/);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('the Last time hint sets the quantity and adds the line', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.click(
      screen.getByRole('button', {
        name: /Last time: 12 for Bellerive Brunello di Montalcino 2020/,
      }),
    );
    expect(
      qty(/Quantity for Bellerive Brunello di Montalcino 2020/),
    ).toHaveValue('12');
    expect(document.getElementById('status-wine_08')).toHaveTextContent(
      'Within stock',
    );
  });

  it('hides the hint on a strict-blocked row but shows it under flexible', () => {
    renderCaller(bellavista.id, 'strict');
    expect(
      screen.queryByRole('button', { name: /Last time: 3 for .*Aubrey/ }),
    ).not.toBeInTheDocument();
  });

  it('shows the hint for the out-of-stock wine under flexible', () => {
    renderCaller(bellavista.id, 'flexible');
    expect(
      screen.getByRole('button', { name: /Last time: 3 for Domaine Aubrey/ }),
    ).toBeVisible();
  });

  it('shows a hint only for wines in last time, and not for the strict-blocked one', () => {
    renderCaller(bellavista.id);
    expect(
      screen.getAllByRole('button', { name: /^Last time: / }),
    ).toHaveLength(3);
  });
});

describe('NewOrderDraft recent wines', () => {
  const brunello = winesFixture.find(({ id }) => id === 'wine_08')!;

  function renderRecent() {
    render(
      <NewOrderDraft
        customers={customersFixture}
        customerId=""
        wines={winesFixture}
        recentWines={[brunello]}
        policy="strict"
      />,
    );
    return userEvent.setup();
  }

  const rowOf = (input: HTMLElement) => input.closest('li')!;

  it('goes to a picked wine without adding a line, then typing adds it', async () => {
    const user = renderRecent();
    await user.click(
      screen.getByRole('button', { name: /^Enter quantity for/ }),
    );
    const input = qty(/Quantity for Bellerive Brunello di Montalcino 2020/);
    expect(input).toHaveFocus();
    expect(input).toHaveValue('');
    expect(rowOf(input)).toHaveClass('animate-row-highlight-b');
    expect(rowOf(input)).toHaveClass('motion-reduce:animate-none');
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: 'center',
      behavior: 'smooth',
    });
    expect(
      screen.getByRole('button', { name: /^Enter quantity for/ }),
    ).toBeVisible();
    expect(screen.queryByText('Enter a quantity')).not.toBeInTheDocument();
    expect(catalogStatus()).toHaveTextContent(
      'Type the quantity for Bellerive Brunello di Montalcino 2020, 750 ml.',
    );
    await user.keyboard('7');
    expect(input).toHaveValue('7');
    expect(
      screen.getByRole('button', { name: /already in this request$/ }),
    ).toBeVisible();
  });

  it('moves to a wine already in the request without a message', async () => {
    const user = renderRecent();
    const input = qty(/Quantity for Bellerive Brunello di Montalcino 2020/);
    await user.type(input, '7');
    await user.click(screen.getByRole('combobox', { name: 'Show' }));
    await user.click(
      screen.getByRole('button', { name: /already in this request$/ }),
    );
    expect(input).toHaveFocus();
    expect(input).toHaveValue('7');
    expect(catalogStatus()).toBeEmptyDOMElement();
  });

  it('restarts the highlight when the same wine is picked again', async () => {
    const user = renderRecent();
    const chip = () =>
      screen.getByRole('button', { name: /Brunello.*(Enter|already)|^Enter/ });
    await user.click(chip());
    const row = rowOf(
      qty(/Quantity for Bellerive Brunello di Montalcino 2020/),
    );
    expect(row).toHaveClass('animate-row-highlight-b');
    await user.click(chip());
    expect(row).toHaveClass('animate-row-highlight-a');
    await user.click(chip());
    expect(row).toHaveClass('animate-row-highlight-b');
  });

  it('resets the producer filter when the picked wine is hidden, then focuses it', async () => {
    const user = renderRecent();
    await user.selectOptions(screen.getByLabelText('Show'), 'Domaine Aubert');
    expect(
      screen.queryByRole('textbox', { name: /Quantity for Bellerive/ }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /^Enter quantity for/ }),
    );
    expect(screen.getByLabelText('Show')).toHaveValue('');
    expect(
      qty(/Quantity for Bellerive Brunello di Montalcino 2020/),
    ).toHaveFocus();
  });

  it('keeps the filter when the picked wine is visible', async () => {
    const user = renderRecent();
    await user.selectOptions(screen.getByLabelText('Show'), brunello.producer);
    await user.click(
      screen.getByRole('button', { name: /^Enter quantity for/ }),
    );
    expect(screen.getByLabelText('Show')).toHaveValue(brunello.producer);
  });

  it('does not replay an old move when the filter changes later', async () => {
    const user = renderRecent();
    await user.click(
      screen.getByRole('button', { name: /^Enter quantity for/ }),
    );
    await user.selectOptions(screen.getByLabelText('Show'), 'Domaine Aubert');
    await user.selectOptions(screen.getByLabelText('Show'), '');
    expect(screen.getByLabelText('Show')).toHaveFocus();
  });

  it('instant scroll under reduced motion', async () => {
    matchMedia.mockReturnValueOnce({ matches: true });
    const user = renderRecent();
    await user.click(
      screen.getByRole('button', { name: /^Enter quantity for/ }),
    );
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: 'center',
      behavior: 'instant',
    });
  });

  it('does not move when the wine is out of stock under strict, and says why', async () => {
    const outOfStock = winesFixture.find(({ available }) => available === 0)!;
    render(
      <NewOrderDraft
        customers={customersFixture}
        customerId=""
        wines={winesFixture}
        recentWines={[outOfStock]}
        policy="strict"
      />,
    );
    const user = userEvent.setup();
    const chip = screen.getByRole('button', {
      name: /can't add under strict policy$/,
    });
    await user.click(chip);
    expect(chip).toHaveFocus();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(catalogStatus()).toHaveTextContent(/can't be added/);
    expect(screen.queryByText(/Type the quantity for/)).not.toBeInTheDocument();
  });
});

describe('NewOrderDraft request panel', () => {
  const panel = () =>
    screen.getByRole('complementary', { name: 'This request' });

  it('shows an added wine once, and removing it clears the row, moves focus nowhere and leaves no message', async () => {
    const { user } = renderCaller(bellavista.id);
    const add = screen.getByRole('button', { name: /^Add .*Brunello.*2020/ });
    await user.click(add);
    expect(
      within(panel()).getAllByRole('button', {
        name: /Brunello.*Go to its row/,
      }),
    ).toHaveLength(1);

    await user.type(
      qty(/Quantity for Bellerive Brunello di Montalcino 2020/),
      '3',
    );
    await user.click(
      within(panel()).getByRole('button', { name: /^Remove .*Brunello/ }),
    );
    expect(within(panel()).queryByRole('list')).not.toBeInTheDocument();
    expect(
      qty(/Quantity for Bellerive Brunello di Montalcino 2020/),
    ).toHaveValue('');
    expect(screen.getByLabelText('Show')).not.toHaveFocus();
    expect(catalogStatus()).toBeEmptyDOMElement();
    expect(
      within(panel()).queryByRole('button', { name: /Undo/ }),
    ).not.toBeInTheDocument();
  });

  it('a panel line focuses its wine, resets a hiding filter and leaves the URL alone', async () => {
    const { user } = renderCaller(bellavista.id);
    await user.click(
      screen.getByRole('button', { name: /^Add .*Brunello.*2020/ }),
    );
    await user.selectOptions(screen.getByLabelText('Show'), 'Domaine Aubert');
    await user.click(
      within(panel()).getByRole('button', { name: /Brunello.*Go to its row/ }),
    );
    expect(screen.getByLabelText('Show')).toHaveValue('');
    expect(
      qty(/Quantity for Bellerive Brunello di Montalcino 2020/),
    ).toHaveFocus();
    expect(window.location.hash).toBe('');
    expect(replace).not.toHaveBeenCalled();
  });

  it('names the chosen customer in the panel', () => {
    renderCaller(bellavista.id);
    expect(within(panel()).getByText(bellavista.name)).toBeVisible();
  });
});
