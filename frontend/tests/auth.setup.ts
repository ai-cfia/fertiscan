// ============================== Playwright auth storage ==============================

import * as fs from "node:fs/promises"
import * as path from "node:path"
import { expect, test as setup } from "@playwright/test"

const authFile = path.join(process.cwd(), "playwright/.auth/user.json")

setup("authenticate", async ({ page }) => {
  await fs.mkdir(path.dirname(authFile), { recursive: true })
  const email = process.env.E2E_LOGIN_EMAIL
  const password = process.env.E2E_LOGIN_PASSWORD
  if (!email || !password) {
    await fs.writeFile(authFile, JSON.stringify({ cookies: [], origins: [] }))
    return
  }
  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await page.waitForURL(/\/fertilizer/)
  await expect(
    page.getByRole("heading", { name: "Product home" }),
  ).toBeVisible()
  await page.context().storageState({ path: authFile })
})
