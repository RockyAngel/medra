// Smoke test: server-renders every app and fails if any throws or renders empty.
import { build } from "esbuild";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { APPS } from "./build.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = fs.mkdtempSync(path.join(root, "node_modules", ".medra-test-"));
let failed = 0;
for (const [name, file] of Object.entries(APPS)) {
  const outfile = path.join(tmp, `${name}.cjs`);
  await build({
    entryPoints: [path.join(root, "src", file)], outfile, bundle: true,
    platform: "node", format: "cjs", jsx: "transform", logLevel: "silent", external: ["react", "react-dom", "react-dom/server"],
    nodePaths: [path.join(root, "node_modules")],
  });
  try {
    const React = (await import("react")).default;
    const { renderToStaticMarkup } = await import("react-dom/server");
    const mod = (await import(pathToFileURL(outfile).href)).default;
    const App = mod.default || mod;
    const html = renderToStaticMarkup(React.createElement(App));
    if (html.length < 100) throw new Error("rendered empty");
    console.log(`PASS ${name} (${html.length} chars)`);
  } catch (e) { failed++; console.log(`FAIL ${name}: ${e.message}`); }
}
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
