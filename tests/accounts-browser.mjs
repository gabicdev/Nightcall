import assert from "node:assert/strict";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "../backend/server.js";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const dir = await mkdtemp(join(tmpdir(), "nightcall-browser-"));
const server = createServer({ database: join(dir, "test.sqlite") });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = "http://127.0.0.1:" + server.address().port;
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
  });
  const page = await context.newPage();
  const errors = [],
    templateRequests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().includes("/templates/")) templateRequests.push(r.url());
  });
  await page.goto(origin);
  await page.locator("#loginForm button").waitFor();
  assert.equal((await page.locator("#authPage").boundingBox()).y, 0);
  assert.equal(await page.locator("#applicationRoot").isVisible(), false);
  await page.reload();
  await page.locator("#authSwitch").click();
  await page.locator("#registerForm [name=name]").fill("Victor");
  await page.locator("#registerForm [name=username]").fill("victor");
  await page.locator("#registerForm [name=password]").fill("senha de teste 42");
  await page.locator("#registerForm button").click();
  await page.locator("#myName").waitFor();
  await page.waitForFunction(
    () => document.querySelector("#myName").textContent === "Victor",
  );
  assert.equal(await page.locator("#authPage").isVisible(), false);
  assert.equal((await page.locator(".app").boundingBox()).y, 0);
  await page.reload();
  await page.waitForFunction(() => window.Nightcall);
  await page.evaluate(() => Nightcall.showFriends());
  await page.locator("#addFriendButton").click();
  await page.locator("#closeAddFriendModal").click();
  await page.evaluate(() => Nightcall.showMessages());
  await page.evaluate(() => Nightcall.showHome());
  await page.locator("#settingsButton").click();
  await page.locator("#profileName").fill("Victor salvo");
  await page.locator("#saveProfile").click();
  await page.waitForFunction(
    () => document.querySelector("#myName").textContent === "Victor salvo",
  );
  await page.reload();
  await page.waitForFunction(
    () => document.querySelector("#myName").textContent === "Victor salvo",
  );
  await page.locator("#logoutButton").click();
  await page.locator("#loginForm").waitFor();
  assert.equal((await page.locator("#authPage").boundingBox()).y, 0);
  await page.reload();
  await page.locator("#loginForm").waitFor();
  await page.locator("#loginForm [name=username]").fill("victor");
  await page.locator("#loginForm [name=password]").fill("senha incorreta");
  await page.locator("#loginForm button").click();
  await page.waitForFunction(() =>
    document.querySelector("#authStatus").textContent.includes("incorretos"),
  );
  await page.locator("#loginForm [name=password]").fill("senha de teste 42");
  await page.locator("#loginForm button").click();
  await page.locator("#logoutButton").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#logoutButton").click();
  await page.locator("#loginForm").waitFor();
  assert.equal((await page.locator("#authPage").boundingBox()).y, 0);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  const other = await browser.newContext();
  const second = await other.newPage();
  await second.goto(origin);
  await second.locator("#loginForm").waitFor();
  assert.equal(await second.locator("#applicationRoot").isVisible(), false);
  await other.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(templateRequests, []);
  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/accounts-mobile.png" });
  await writeFile(
    "test-results/accounts.json",
    JSON.stringify(
      {
        passed: true,
        states: [
          "logged out y=0",
          "register",
          "authenticated y=0",
          "refresh authenticated",
          "navigation",
          "save profile",
          "logout",
          "refresh logged out",
          "wrong password",
          "login",
          "mobile",
          "separate browser session",
        ],
        errors,
        templateRequests,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: cadastro, login, refresh, logout, perfil, navegação, mobile, sessões isoladas; sem erros JS e sem fetch de templates.",
  );
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
  await rm(dir, { recursive: true, force: true });
}
