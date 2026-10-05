import { writeFileSync } from "node:fs";
// Metro emits CommonJS bundles even though our application server uses ESM.
writeFileSync("dist/server/package.json", JSON.stringify({ type: "commonjs" }));
