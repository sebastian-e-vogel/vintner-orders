import { expect, test } from '@playwright/test';
import { saveRequest, setPolicy, wineIds } from './api';

test.describe.configure({ mode: 'serial' });

test('shows the empty state before anything is saved', async ({ page }) => {
  await page.goto('/requests');

  await expect(page.getByRole('status')).toHaveText('0 requests');
  await expect(
    page.getByRole('heading', { name: 'No saved requests yet' }),
  ).toBeVisible();
});

test.describe('with two saved requests', () => {
  test.beforeAll(async ({ request }) => {
    try {
      await saveRequest(request, wineIds.inStock, 2);
      await setPolicy(request, 'flexible');
      await saveRequest(request, wineIds.outOfStock, 3);
    } finally {
      await setPolicy(request, 'strict');
    }
  });

  test('lists them newest first and counts them', async ({ page }) => {
    await page.goto('/requests');

    await expect(page.getByRole('status')).toHaveText('2 requests');
    const cards = page.getByRole('article');
    await expect(cards).toHaveCount(2);
    await expect(cards.first()).toContainText('Flexible policy');
    await expect(cards.first()).toContainText('1 short at save');
    await expect(cards.last()).toContainText('Strict policy');
    await expect(cards.last()).not.toContainText('short at save');
  });

  test('the policy dialog mentions the saved requests', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('radio', { name: /Flexible/ }).check();
    await page.getByRole('button', { name: 'Change to Flexible…' }).click();

    await expect(page.getByRole('dialog')).toContainText(
      'The 2 requests already saved keep the policy they were saved under.',
    );
    await page.getByRole('button', { name: 'Cancel' }).click();
  });
});
