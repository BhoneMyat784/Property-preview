import path from "node:path";
import fs from "node:fs/promises";
import { sqlite } from "./db.js";
import { dataDir } from "./config.js";
const destination = path.resolve(
  process.argv[2] ||
    path.join(
      dataDir,
      "backups",
      new Date().toISOString().replaceAll(":", "-"),
    ),
);
await fs.mkdir(destination, { recursive: true });
await sqlite.backup(path.join(destination, "portal.sqlite"));
await fs
  .cp(path.join(dataDir, "uploads"), path.join(destination, "uploads"), {
    recursive: true,
  })
  .catch((e) => {
    if (e.code !== "ENOENT") throw e;
  });
sqlite.close();
console.log(
  `Backup saved to ${destination}. Stop writes during backups to keep database and photos aligned.`,
);
