import { expect, test, type Page } from '@playwright/test';
import { setPolicy } from './api';

// Policy is global state: put it back even when a test fails midway.
test.afterEach(async ({ request }) => {
  await setPolicy(request, 'strict');
});

async function focus(
  page: Page,
  name: string | RegExp,
  role: 'radio' | 'button',
) {
  const target = page.getByRole(role, {
    name,
    exact: typeof name === 'string',
  });
  for (let i = 0; i < 30; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Could not reach ${String(name)} with Tab`);
}

// Tab reaches only the checked radio of a group; arrow keys move to the other one.
async function chooseWithKeyboard(page: Page, from: string, to: string) {
  await focus(page, new RegExp(`^${from}`), 'radio');
  await page.keyboard.press(to === 'Flexible' ? 'ArrowDown' : 'ArrowUp');
  await expect(
    page.getByRole('radio', { name: new RegExp(`^${to}`) }),
  ).toBeChecked();
}

async function changePolicyWithKeyboard(
  page: Page,
  label: 'Strict' | 'Flexible',
) {
  await chooseWithKeyboard(
    page,
    label === 'Flexible' ? 'Strict' : 'Flexible',
    label,
  );
  await focus(page, `Change to ${label}…`, 'button');
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog', { name: `Change to ${label}?` });
  await expect(dialog).toBeVisible();
  await focus(page, `Change to ${label}`, 'button');
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
}

test('switches strict to flexible and back with the keyboard only', async ({
  page,
}) => {
  await page.goto('/settings');
  await expect(page.getByText('Strict', { exact: true }).first()).toBeVisible();

  await changePolicyWithKeyboard(page, 'Flexible');
  await expect(page.getByRole('status').first()).toContainText(
    'The policy is now Flexible.',
  );
  await expect(page.getByRole('status').first()).toContainText(/Updated at \d/);

  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Flexible is in use' }),
  ).toBeDisabled();
  await expect(page.getByText(/^Since /)).toBeVisible();

  await changePolicyWithKeyboard(page, 'Strict');
  await expect(page.getByRole('status').first()).toContainText(
    'The policy is now Strict.',
  );

  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Strict is in use' }),
  ).toBeDisabled();
});

test('Escape closes the dialog and keeps the policy', async ({ page }) => {
  await page.goto('/settings');
  await chooseWithKeyboard(page, 'Strict', 'Flexible');
  await focus(page, 'Change to Flexible…', 'button');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(page.getByRole('dialog')).toBeHidden();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Strict is in use' }),
  ).toBeDisabled();
});
