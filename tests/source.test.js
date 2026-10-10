import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
test("imports e referências HTML apontam para arquivos existentes", async () => {
  for (const file of await readdir("js")) {
    const source = await readFile("js/" + file, "utf8");
    for (const m of source.matchAll(/from\s+["'](\.[^"']+)["']/g))
      assert.ok((await stat(resolve("js", m[1]))).isFile());
  }
  const html = await readFile("index.html", "utf8");
  for (const m of html.matchAll(/(?:src|href)="((?:js|css)\/[^"#]+)"/g))
    assert.ok((await stat(m[1])).isFile());
  assert.ok(html.includes('type="module"'));
});
test("a estrutura das páginas continua estática no HTML", async () => {
  const html = await readFile("index.html", "utf8");
  for (const id of [
    "homePage",
    "friendsPage",
    "messagesPage",
    "settingsOverlay",
    "addFriendModal",
    "profileSection",
    "audioSection",
  ])
    assert.ok(html.includes('id="' + id + '"'));
  for (const file of await readdir("js"))
    assert.ok(
      !/fetch\s*\(\s*['"]\/templates\//.test(
        await readFile("js/" + file, "utf8"),
      ),
    );
});
