import { expect, test, type Page } from '@playwright/test';
import { customerId, wineIds } from './api';

// The tests save requests, so they run in order and count relative to the start.
test.describe.configure({ mode: 'serial' });

async function savedCount(page: Page) {
  await page.goto('/requests');
  const status = page.getByRole('status');
  await expect(status).toHaveText(/^\d+ requests?$/);
  const text = await status.innerText();
  return Number(text.split(' ')[0]);
}

async function fillDraft(page: Page) {
  await page.goto('/');
  await page.getByLabel('Customer').selectOption(customerId);
  await expect(page).toHaveURL(/customer=/);
  await page.getByLabel('Caller name').fill('Giulia Ferrante');
  await page.getByLabel('Caller phone').fill('+39 055 555 0101');
  await page.locator(`#quantity-${wineIds.inStock}`).fill('1');
}

test('the new order page shows the policy from the API', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'New order request' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Strict' })).toBeVisible();
});

test('an empty draft cannot be reviewed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Review and save/ }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('group', { name: /Before you can save, fix these/ }),
  ).toBeFocused();
});

test('saves a request from the keyboard and lists it', async ({ page }) => {
  const before = await savedCount(page);
  await fillDraft(page);

  await page.keyboard.press('ControlOrMeta+Enter');
  const dialog = page.getByRole('dialog', { name: 'Read back to the caller' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Enter');

  await expect(
    page.getByRole('dialog', { name: 'Request saved' }),
  ).toBeVisible();
  await page.reload();
  expect(await savedCount(page)).toBe(before + 1);
});

test('a double submit saves one request', async ({ page }) => {
  const before = await savedCount(page);
  await fillDraft(page);

  await page.getByRole('button', { name: /Review and save/ }).click();
  await page
    .getByRole('button', { name: 'Caller confirmed — save request' })
    .dblclick();

  await expect(
    page.getByRole('dialog', { name: 'Request saved' }),
  ).toBeVisible();
  expect(await savedCount(page)).toBe(before + 1);
});
