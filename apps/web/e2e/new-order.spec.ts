import { expect, test } from '@playwright/test';

test('the new order page shows the policy from the API', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'New order request' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Strict' })).toBeVisible();
});
