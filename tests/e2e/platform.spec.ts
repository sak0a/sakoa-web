import { expect, test } from '@playwright/test'

test('public arena exposes the core status, ranking, and support paths', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Own the air')
  await expect(page.getByRole('heading', { name: 'Server status' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Season rankings' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Support rewards' })).toBeVisible()
})

test('admin routes redirect to a signed-session login and open the control room', async ({ page }, testInfo) => {
  await page.goto('/admin/dashboard')
  await expect(page).toHaveURL(/\/admin$/)

  await page.getByLabel('Password').fill('e2e-admin-password')
  await page.getByRole('button', { name: 'Enter control room' }).click()

  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Arena control.' })).toBeVisible()
  if (testInfo.project.name.startsWith('mobile')) {
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible()
  } else {
    await expect(page.getByRole('navigation', { name: 'Administration' })).toBeVisible()
  }
})

test('mobile navigation opens and reaches the rankings anchor', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'mobile-only navigation scenario')
  await page.goto('/')

  const toggle = page.getByRole('button', { name: 'Open navigation' })
  await expect(toggle).toHaveAttribute('data-hydrated', 'true')
  await toggle.click()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
  await page.getByRole('link', { name: 'Ranks' }).click()

  await expect(page).toHaveURL(/#leaderboard$/)
  await expect(page.getByRole('heading', { name: 'Season rankings' })).toBeVisible()
})
