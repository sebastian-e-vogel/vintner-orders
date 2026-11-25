import { expect, test, type Page } from '@playwright/test';
import { saveRequest, setPolicy, wineIds } from './api';

test.describe.configure({ mode: 'serial' });

async function savedCount(page: Page) {
  await page.goto('/requests');
  const status = page.getByRole('status');
  await expect(status).toHaveText(/^\d+ requests?$/);
  return Number((await status.innerText()).split(' ')[0]);
}

test.describe('with two more saved requests', () => {
  let before = 0;

  test.beforeAll(async ({ browser, request }) => {
    const page = await browser.newPage();
    try {
      before = await savedCount(page);
    } finally {
      await page.close();
    }
    try {
      await saveRequest(request, wineIds.inStock, 2);
      await setPolicy(request, 'flexible');
      await saveRequest(request, wineIds.outOfStock, 3);
    } finally {
      await setPolicy(request, 'strict');
    }
  });

  test('lists them newest first and counts them', async ({ page }) => {
    expect(await savedCount(page)).toBe(before + 2);

    // The two newest cards are the ones this spec just saved.
    const cards = page.getByRole('article');
    await expect(cards.first()).toContainText('Flexible policy');
    await expect(cards.first()).toContainText('1 short at save');
    await expect(cards.nth(1)).toContainText('Strict policy');
    await expect(cards.nth(1)).not.toContainText('short at save');
  });

  test('the policy dialog mentions the saved requests', async ({ page }) => {
    const count = before + 2;
    await page.goto('/settings');
    await page.getByRole('radio', { name: /Flexible/ }).check();
    await page.getByRole('button', { name: 'Change to Flexible…' }).click();

    await expect(page.getByRole('dialog')).toContainText(
      `The ${count} requests already saved keep the policy they were saved under.`,
    );
    await page.getByRole('button', { name: 'Cancel' }).click();
  });
});
