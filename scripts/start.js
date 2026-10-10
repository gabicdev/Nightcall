import { createServer } from "../backend/server.js";
const host = process.env.NIGHTCALL_HOST || "127.0.0.1";
const publicOrigin = process.env.NIGHTCALL_PUBLIC_ORIGIN || "";
if (host !== "127.0.0.1" && host !== "::1" && !publicOrigin) {
  throw Error("Exposição de rede exige NIGHTCALL_PUBLIC_ORIGIN=https://seu-dominio (HTTPS via proxy reverso).");
}
const iceServers = process.env.NIGHTCALL_ICE_SERVERS_JSON
  ? JSON.parse(process.env.NIGHTCALL_ICE_SERVERS_JSON)
  : [{ urls: "stun:stun.l.google.com:19302" }];
if (!Array.isArray(iceServers) || iceServers.length > 8 || iceServers.some(x =>
  !x || typeof x !== "object" || !(typeof x.urls === "string" || Array.isArray(x.urls)) ||
  JSON.stringify(x).length > 2048
)) throw Error("NIGHTCALL_ICE_SERVERS_JSON inválido.");
const server = createServer({
  secure: Boolean(publicOrigin) || process.env.COOKIE_SECURE === "1",
  publicOrigin,
  iceServers,
  database: process.env.NIGHTCALL_DATABASE || "data/nightcall.sqlite",
});
server.listen(Number(process.env.PORT || 3000), host, () =>
  console.log(`Nightcall escutando em ${host}:${server.address().port}`),
);
