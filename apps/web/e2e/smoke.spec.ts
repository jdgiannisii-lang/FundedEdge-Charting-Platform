import { expect, test } from '@playwright/test';

test('homepage renders FundedEdge', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('FundedEdge')).toBeVisible();
});
