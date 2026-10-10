import { cp, mkdir, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
for (const folder of ["js", "backend"])
  for (const file of await readdir(folder)) {
    const result = spawnSync(
      process.execPath,
      ["--check", folder + "/" + file],
      { stdio: "inherit" },
    );
    if (result.status !== 0) throw Error("Sintaxe inválida: " + file);
  }
await mkdir("dist", { recursive: true });
for (const file of ["index.html", "js", "css", "assets"])
  await cp(file, "dist/" + file, { recursive: true });
console.log("Build OK: frontend em dist/.");
