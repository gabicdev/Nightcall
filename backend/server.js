import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { randomUUID } from "node:crypto";
import { openDatabase } from "./database.js";
import {
  createSessions,
  hashPassword,
  verifyPassword,
  publicUser,
} from "./accounts.js";

export function createServer({
  root = resolve("."),
  database = resolve("data/nightcall.sqlite"),
  secure = false,
} = {}) {
  const db = openDatabase(database);
  const sessions = createSessions(db, secure);
  const attempts = new Map();
  const dummyPassword = hashPassword(randomUUID());
  const reply = (res, status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify(data));
  };
  async function body(req) {
    let text = "";
    if (!req.headers["content-type"]?.startsWith("application/json"))
      throw Object.assign(Error("Envie JSON."), { status: 415 });
    for await (const part of req) {
      text += part;
      if (Buffer.byteLength(text) > 16384)
        throw Object.assign(Error("Dados grandes demais."), { status: 413 });
    }
    try {
      const value = JSON.parse(text);
      if (!value || Array.isArray(value) || typeof value !== "object")
        throw Error();
      return value;
    } catch {
      throw Object.assign(Error("JSON inválido."), { status: 400 });
    }
  }
  function validateProfile(input) {
    const { username, name, bio = "", avatar = "" } = input;
    if (
      typeof username !== "string" ||
      !/^[a-zA-Z0-9_]{3,24}$/.test(username) ||
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 60 ||
      typeof bio !== "string" ||
      bio.length > 200 ||
      typeof avatar !== "string" ||
      avatar.length > 2048
    )
      throw Object.assign(
        Error(
          "Confira nome, usuário (3–24 letras, números ou _) e bio (até 200 caracteres).",
        ),
        { status: 400 },
      );
    if (avatar) {
      let url;
      try {
        url = new URL(avatar);
      } catch {}
      if (!url || !["https:", "http:"].includes(url.protocol))
        throw Object.assign(Error("Avatar deve ser um link HTTP ou HTTPS."), {
          status: 400,
        });
    }
    return { username: username.toLowerCase(), name: name.trim(), bio, avatar };
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: http: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    try {
      const path = new URL(req.url, "http://localhost").pathname;
      if (path.startsWith("/api/")) {
        if (
          !["GET", "HEAD"].includes(req.method) &&
          (req.headers["sec-fetch-site"] === "cross-site" ||
            (req.headers.origin &&
              req.headers.origin !==
                `${secure ? "https" : "http"}://${req.headers.host}`))
        )
          return reply(res, 403, { error: "Origem não permitida." });
        if (
          req.method === "POST" &&
          ["/api/auth/register", "/api/auth/login"].includes(path)
        ) {
          const now = Date.now();
          for (const [key, entry] of attempts)
            if (entry.until <= now) attempts.delete(key);
          const key = req.socket.remoteAddress;
          const entry = attempts.get(key) || { count: 0, until: now + 60000 };
          attempts.set(key, entry);
          if (++entry.count > 20)
            return reply(res, 429, {
              error: "Muitas tentativas. Aguarde um minuto.",
            });
          const input = await body(req);
          if (
            typeof input.password !== "string" ||
            input.password.length < 10 ||
            input.password.length > 128
          )
            return reply(res, 400, {
              error: "Use uma senha de 10 a 128 caracteres.",
            });
          if (path.endsWith("/register")) {
            const profile = validateProfile(input);
            const password = await hashPassword(input.password);
            const id = randomUUID();
            db.prepare(
              "INSERT INTO users (id, username, password, name) VALUES (?,?,?,?)",
            ).run(id, profile.username, password, profile.name);
            sessions.start(req, res, id);
            return reply(res, 201, {
              user: publicUser(
                db.prepare("SELECT * FROM users WHERE id=?").get(id),
              ),
            });
          }
          const row = db
            .prepare("SELECT * FROM users WHERE username=?")
            .get(typeof input.username === "string" ? input.username : "");
          const valid = await verifyPassword(
            input.password,
            row?.password || (await dummyPassword),
          );
          if (!row || !valid)
            return reply(res, 401, { error: "Usuário ou senha incorretos." });
          sessions.start(req, res, row.id);
          return reply(res, 200, { user: publicUser(row) });
        }
        if (path === "/api/auth/logout" && req.method === "POST") {
          sessions.end(req, res);
          return reply(res, 200, { ok: true });
        }
        const user = sessions.user(req);
        if (!user) return reply(res, 401, { error: "Entre na sua conta." });
        if (path === "/api/auth/me" && req.method === "GET")
          return reply(res, 200, { user: publicUser(user) });
        if (path === "/api/profile" && req.method === "PUT") {
          const profile = validateProfile(await body(req));
          db.prepare(
            "UPDATE users SET username=?, name=?, bio=?, avatar=? WHERE id=?",
          ).run(
            profile.username,
            profile.name,
            profile.bio,
            profile.avatar,
            user.id,
          );
          return reply(res, 200, {
            user: publicUser(
              db.prepare("SELECT * FROM users WHERE id=?").get(user.id),
            ),
          });
        }
        return reply(res, 404, { error: "Recurso não encontrado." });
      }
      // Somente arquivos públicos: banco, backend e configuração nunca são servidos.
      if (
        !["GET", "HEAD"].includes(req.method) ||
        !(
          /^\/(?:index\.html)?$/.test(path) ||
          /^\/(js|css)\/[a-zA-Z0-9_-]+\.(js|css)$/.test(path)
        )
      )
        return reply(res, 404, { error: "Não encontrado." });
      const file = resolve(root, "." + (path === "/" ? "/index.html" : path));
      const content = await readFile(file);
      res.writeHead(200, {
        "Content-Type":
          {
            ".html": "text/html",
            ".js": "text/javascript",
            ".css": "text/css",
          }[extname(file)] + "; charset=utf-8",
      });
      res.end(req.method === "HEAD" ? undefined : content);
    } catch (error) {
      const conflict = error.message?.includes("UNIQUE constraint");
      reply(
        res,
        conflict ? 409 : error.status || (error.code === "ENOENT" ? 404 : 500),
        {
          error: conflict
            ? "Esse usuário já existe."
            : error.status
              ? error.message
              : "Não foi possível concluir a operação.",
        },
      );
    }
  });
  server.on("close", () => db.close());
  return server;
}
