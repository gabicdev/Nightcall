import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
export const tokenHash = (value) =>
  createHash("sha256").update(value).digest("hex");
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return (
    salt + ":" + Buffer.from(await scrypt(password, salt, 64)).toString("hex")
  );
}
export async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const actual = Buffer.from(await scrypt(password, salt, 64));
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}
export const publicUser = (row) => ({
  id: row.id,
  username: row.username,
  name: row.name,
  bio: row.bio,
  avatar: row.avatar,
  banner: row.banner || "",
});
export function createSessions(db, secure = false) {
  const age = 7 * 24 * 60 * 60;
  const cookie = (value, maxAge) =>
    `nightcall_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
  function token(req) {
    return (
      (req.headers.cookie || "")
        .split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith("nightcall_session="))
        ?.slice(18) || ""
    );
  }
  return {
    user(req) {
      return db
        .prepare(
          "SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires>?",
        )
        .get(tokenHash(token(req)), Date.now());
    },
    start(req, res, id) {
      db.prepare("DELETE FROM sessions WHERE token_hash=? OR expires<=?").run(
        tokenHash(token(req)),
        Date.now(),
      );
      const value = randomBytes(32).toString("hex");
      db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
        tokenHash(value),
        id,
        Date.now() + age * 1000,
      );
      res.setHeader("Set-Cookie", cookie(value, age));
    },
    end(req, res) {
      db.prepare("DELETE FROM sessions WHERE token_hash=?").run(
        tokenHash(token(req)),
      );
      res.setHeader("Set-Cookie", cookie("", 0));
    },
  };
}
