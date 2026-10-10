import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "../backend/server.js";
test("cadastro, sessões isoladas, perfil, persistência, logout e proteção", async () => {
  const dir = await mkdtemp(join(tmpdir(), "nightcall-"));
  let server, origin;
  const start = async () => {
    server = createServer({ database: join(dir, "db.sqlite") });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    origin = "http://127.0.0.1:" + server.address().port;
  };
  const stop = () => new Promise((r) => server.close(r));
  const call = async (path, method = "GET", data, cookie = "", extra = {}) => {
    const r = await fetch(origin + path, {
      method,
      headers: { "Content-Type": "application/json", cookie, ...extra },
      body: data ? JSON.stringify(data) : undefined,
    });
    return {
      status: r.status,
      data: await r.json(),
      cookie: r.headers.get("set-cookie"),
    };
  };
  const credentials = {
    username: "alice",
    name: "Alice",
    password: "correct horse 42",
  };
  try {
    await start();
    assert.equal((await call("/api/auth/me")).status, 401);
    assert.equal(
      (
        await call("/api/auth/register", "POST", {
          ...credentials,
          password: "short",
        })
      ).status,
      400,
    );
    const alice = await call("/api/auth/register", "POST", credentials);
    assert.equal(alice.status, 201);
    assert.match(alice.cookie, /HttpOnly/);
    assert.match(alice.cookie, /SameSite=Strict/);
    assert.equal(alice.data.user.password, undefined);
    const a = alice.cookie.split(";")[0];
    assert.equal(
      (
        await call("/api/auth/register", "POST", {
          ...credentials,
          username: "ALICE",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await call("/api/auth/login", "POST", {
          ...credentials,
          password: "wrong password",
        })
      ).status,
      401,
    );
    const bob = await call("/api/auth/register", "POST", {
      ...credentials,
      username: "bob",
      name: "Bob",
    });
    const b = bob.cookie.split(";")[0];
    assert.equal(
      (await call("/api/auth/me", "GET", null, a)).data.user.username,
      "alice",
    );
    assert.equal(
      (await call("/api/auth/me", "GET", null, b)).data.user.username,
      "bob",
    );
    assert.equal(
      (
        await call(
          "/api/profile",
          "PUT",
          { username: "alice", name: "Alice salva", bio: "Olá" },
          a,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await call(
          "/api/profile",
          "PUT",
          { username: "bob", name: "Duplicado" },
          a,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await call(
          "/api/profile",
          "PUT",
          { username: "alice", name: "Alice", avatar: "javascript:alert(1)" },
          a,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await call("/api/auth/logout", "POST", null, a, {
          origin: "https://evil.example",
        })
      ).status,
      403,
    );
    for (const path of [
      "/backend/server.js",
      "/data/nightcall.sqlite",
      "/package.json",
      "/.env",
    ])
      assert.equal((await call(path)).status, 404);
    await stop();
    await start();
    assert.equal(
      (await call("/api/auth/me", "GET", null, a)).data.user.name,
      "Alice salva",
    );
    assert.equal((await call("/api/auth/logout", "POST", null, a)).status, 200);
    assert.equal((await call("/api/auth/me", "GET", null, a)).status, 401);
    assert.equal((await call("/api/auth/me", "GET", null, b)).status, 200);
    assert.equal(
      (await call("/api/auth/login", "POST", credentials)).status,
      200,
    );
    for (let i = 0; i < 20; i++)
      await call("/api/auth/login", "POST", {
        ...credentials,
        password: "wrong password",
      });
    assert.equal(
      (await call("/api/auth/login", "POST", credentials)).status,
      429,
    );
  } finally {
    await stop();
    await rm(dir, { recursive: true, force: true });
  }
});
