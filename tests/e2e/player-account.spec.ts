import { expect, test } from '@playwright/test'

const csrfToken = 'a'.repeat(64)
const session = { authenticated: true, loginAvailable: true, steam64: '76561197960265729', steamid: '[U:1:1]', csrfToken }
const account = {
  identity: { name: 'Rocket', avatar: null, steamid: '[U:1:1]', steam64: session.steam64 },
  donor: { active: true, exists: true, tier: 'Premium', permanent: true, expiresAt: null, state: 'active' },
  preferences: { tag: 'VIP', nameColor: '{#aabbcc}', chatColor: '{#ddaaff}', useGroupTag: false, useGroupNameColor: false, useGroupChatColor: false, version: 'b'.repeat(64), group: { tag: '--n', nameColor: '{gold}', chatColor: '--n' } },
  stats: { currentSeason: 3, season: 3, player: { kills: 120, deaths: 40, rank: 24, points: 2300, deflections: 8420, playtime: 453600 } },
  unavailable: { donor: false, preferences: false, stats: false, profile: false }, colorWritesEnabled: true
}

test('Steam panel opens, traps focus, and restores focus on Escape', async ({ page }) => {
  await page.route('**/api/account/session', route => route.fulfill({ json: { authenticated: false, loginAvailable: true } }))
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Steam login' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Your account' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('link', { name: 'Sign in through Steam' })).toHaveAttribute('href', '/api/auth/steam')
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog')))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
})

test('donator edits show a preview and submit CSRF-protected personal settings', async ({ page }) => {
  await page.route('**/api/account/session', route => route.fulfill({ json: session }))
  await page.route(/\/api\/account(?:\?.*)?$/, route => route.fulfill({ json: account }))
  let submitted: any
  await page.route('**/api/account/preferences', async route => {
    submitted = route.request().postDataJSON()
    expect(route.request().headers()['x-csrf-token']).toBe(csrfToken)
    await route.fulfill({ json: { success: true } })
  })
  await page.goto('/?account=open')
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Premium · Active')).toBeVisible()
  await dialog.getByRole('textbox', { name: 'Chat tag' }).fill('ROCKET')
  await expect(dialog.locator('.account-chat-preview')).toContainText('ROCKET')
  await dialog.getByRole('button', { name: 'Save preferences' }).click()
  await expect(dialog.getByText('Preferences saved.', { exact: false })).toBeVisible()
  expect(submitted.tag).toBe('ROCKET')
  expect(submitted).not.toHaveProperty('steamid')
  expect(submitted).not.toHaveProperty('expiry_date')
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: `test-results/player-account-${test.info().project.name}.png`, fullPage: false })
})

test('expired donors keep stats but cannot edit styling', async ({ page }) => {
  await page.route('**/api/account/session', route => route.fulfill({ json: session }))
  await page.route(/\/api\/account(?:\?.*)?$/, route => route.fulfill({ json: { ...account, donor: { ...account.donor, active: false, permanent: false, state: 'expired', expiresAt: 1 } } }))
  await page.goto('/?account=open')
  await expect(page.getByText('Donator benefits expired')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Chat tag' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Save preferences' })).toBeDisabled()
  await expect(page.getByRole('dialog').getByText('#24')).toBeVisible()
})

test('account access fits narrow and tablet navigation before and after scrolling', async ({ page }) => {
  await page.route('**/api/account/session', route => route.fulfill({ json: { authenticated: false, loginAvailable: true } }))
  for (const width of [360, 1024]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Steam login' })
    await expect(trigger).toBeEnabled()
    for (const scroll of [0, 900]) {
      await page.evaluate(y => window.scrollTo(0, y), scroll)
      await trigger.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
      await page.getByRole('button', { name: 'Close account panel' }).click()
      const box = await trigger.boundingBox()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(width)
    }
  }
})

test('unavailable account sections are explicit and logout returns to sign-in', async ({ page }) => {
  await page.route('**/api/account/session', route => route.fulfill({ json: session }))
  await page.route(/\/api\/account(?:\?.*)?$/, route => route.fulfill({ json: { ...account, donor: null, preferences: null, stats: null, unavailable: { ...account.unavailable, donor: true, preferences: true, stats: true } } }))
  await page.route('**/api/account/logout', route => route.fulfill({ json: { success: true } }))
  await page.goto('/?account=open')
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Benefits unavailable')).toBeVisible()
  await expect(dialog.getByText('Stats are unavailable right now.', { exact: false })).toBeVisible()
  await expect(dialog.getByText('Chat settings are unavailable.', { exact: false })).toBeVisible()
  await dialog.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(dialog.getByRole('link', { name: 'Sign in through Steam' })).toBeVisible()
  await expect(dialog.getByText('Rocket', { exact: true })).toHaveCount(0)
})
