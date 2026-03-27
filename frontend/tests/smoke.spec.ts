// ============================== Smoke tests ==============================

import { expect, test } from "@playwright/test"

test("login page renders", async ({ browser }) => {
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  })
  const page = await context.newPage()
  await page.goto("/login")
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible()
  await context.close()
})

test("protected product route redirects to login when unauthenticated", async ({
  browser,
}) => {
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  })
  const page = await context.newPage()
  await page.goto("/fertilizer")
  await expect(page).toHaveURL(/\/login/)
  await context.close()
})
