import { createServer } from "../backend/server.js";
const server = createServer({
  secure: process.env.COOKIE_SECURE === "1",
  database: process.env.NIGHTCALL_DATABASE || "data/nightcall.sqlite",
});
server.listen(Number(process.env.PORT || 3000), "127.0.0.1", () =>
  console.log("Nightcall: http://127.0.0.1:" + server.address().port),
);
