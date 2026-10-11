import assert from "node:assert/strict";
import { createServer } from "../backend/server.js";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
async function start(root) {
  const dir = await mkdtemp(join(tmpdir(), "nightcall-regression-"));
  const server = createServer({ root, database: join(dir, "test.sqlite") });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return {
    url: "http://127.0.0.1:" + server.address().port,
    close: async () => {
      await new Promise((r) => server.close(r));
      await rm(dir, { recursive: true, force: true });
    },
  };
}
let browser;
const servers = [];
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });
  await mkdir("test-results", { recursive: true });
  const results = [];
  const roots = [resolve(".")];
  for (let i = 0; i < roots.length; i++) {
    const server = await start(roots[i]);
    servers.push(server);
    const context = await browser.newContext({
      viewport: { width: 1366, height: 900 },
      permissions: ["microphone"],
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await context.request.post(server.url + "/api/auth/register", {
      data: {
        name: "Usuário",
        username: "teste",
        password: "senha de teste 123",
      },
    });
    await page.goto(server.url);
    await page.waitForFunction(
      () =>
        window.Nightcall &&
        document.getElementById("previewName").textContent.trim() === "Usuário",
    );
    const snapshots = [];
    async function snapshot(name) {
      await page.mouse.move(1, 1);
      await page.evaluate(() =>
        document.getAnimations().forEach((animation) => {
          try {
            animation.finish();
          } catch {}
        }),
      );
      snapshots.push({
        name,
        values: await page.evaluate(() =>
          [...document.querySelectorAll("[id]")].map((e) => {
            const c = getComputedStyle(e);
            return [
              e.id,
              c.display,
              c.color,
              c.backgroundColor,
              c.gridTemplateColumns,
              c.borderRadius,
              c.fontSize,
            ];
          }),
        ),
      });
    }
    await snapshot("home");
    await page.evaluate(() => Nightcall.showFriends());
    await page.locator("#addFriendButton").click();
    await page.locator("#addFriendUsername").fill("inexistente");
    await page.locator("#searchFriendButton").click();
    assert.ok((await page.locator("#addFriendError").innerText()).trim());
    await page.locator("#closeAddFriendModal").click();
    await snapshot("friends");
    await page.evaluate(() => Nightcall.showMessages());
    await snapshot("messages");
    await page.evaluate(async () => {
      const state = document.querySelector("script[type=module]")
        ? await import("/js/navigation.js")
        : { friends, friendRequests, conversations };
      state.friends.push({ name: "Gabrielly", username: "gabi", online: true });
      state.conversations.push({ name: "Gabrielly", username: "gabi" });
      Nightcall.showFriends();
    });
    assert.equal(await page.locator(".friend-card").count(), 1);
    await page.locator("#friendSearch").fill("ninguém");
    assert.equal(await page.locator(".friend-card").count(), 0);
    await page.locator("#friendSearch").fill("gabi");
    assert.equal(await page.locator(".friend-card").count(), 1);
    await page.locator('.friend-action[title="Enviar mensagem"]').click();
    assert.equal(await page.locator(".conversation-card").count(), 1);
    await snapshot("local-fixtures");
    await page.locator("#settingsButton").click(); await page.locator('[data-settings-open="profile"]').click();
    await page.locator("#profileName").fill("Victor Teste");
    await page.locator("#profileUsername").fill("victor");
    await page.locator("#profileBio").fill("Perfil local preservado");
    await page.locator("#saveProfile").click();
    await page.waitForFunction(
      () => document.querySelector("#myName").textContent === "Victor Teste",
    );
    assert.equal(await page.locator("#myName").textContent(), "Victor Teste");
    assert.equal(await page.locator("#bioCount").textContent(), "23");
    for (const section of [
      "audio",
      "appearance",
      "notifications",
      "privacy",
      "profile",
    ]) {
      await page
        .locator('.settings-nav-item[data-section="' + section + '"]')
        .click();
      await snapshot(section);
    }
    await page
      .locator('.settings-nav-item[data-section="notifications"]')
      .click();
    await page.locator("label:has(#messageNotifications)").click();
    await page.locator('.settings-nav-item[data-section="privacy"]').click();
    await page.locator("label:has(#onlineStatus)").click();
    await page.locator("#savePrivacy").click();
    await page.reload();
    await page.waitForFunction(() => !!window.Nightcall);
    await page.locator("#settingsButton").click(); await page.locator('[data-settings-open="profile"]').click();
    await page.locator('.settings-nav-item[data-section="profile"]').click();
    assert.equal(
      await page.locator("#profileName").inputValue(),
      "Victor Teste",
    );
    await page
      .locator('.settings-nav-item[data-section="notifications"]')
      .click();
    assert.equal(
      await page.locator("#messageNotifications").isChecked(),
      false,
    );
    await page.locator("#closeSettingsButton").click();
    await page.evaluate(() => Nightcall.showHome());
    await snapshot("home-final");
    await page.screenshot({ path: "test-results/home-" + i + ".png" });
    await page.setViewportSize({ width: 390, height: 844 });
    await snapshot("mobile");
    await page.screenshot({ path: "test-results/mobile-" + i + ".png" });
    assert.deepEqual(errors, []);
    results.push(snapshots);
    await context.close();
  }
  if (results.length === 2)
    for (let step = 0; step < results[0].length; step++)
      for (let row = 0; row < results[0][step].values.length; row++)
        assert.deepEqual(
          results[1][step].values[row],
          results[0][step].values[row],
          results[0][step].name + " / row " + row,
        );
  await writeFile(
    "test-results/browser.json",
    JSON.stringify(
      {
        passed: true,
        comparedWithBaseline: results.length === 2,
        states: results.at(-1).map((s) => s.name),
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: navegação, modal/busca local, perfil salvo/reload, preferências, sem erros JS; estilos equivalentes à baseline quando fornecida.",
  );
} finally {
  await browser?.close();
  for (const s of servers) await s.close();
}
