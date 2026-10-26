// Bundles each src/*.jsx app into a self-contained HTML file in dist/.
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const APPS = {
  customer: "medra.jsx",
  seller: "medra-seller.jsx",
  rider: "medra-rider.jsx",
  admin: "medra-admin.jsx",
  support: "medra-support.jsx",
  "super-admin": "medra-superadmin.jsx",
  landing: "medra-landing.jsx",
  combined: "medra-combined.jsx",
};

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
for (const [name, file] of Object.entries(APPS)) {
  const entry = `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./${file}";
createRoot(document.getElementById("root")).render(React.createElement(App));`;
  const out = await build({
    stdin: { contents: entry, resolveDir: path.join(root, "src"), loader: "jsx" },
    bundle: true, minify: true, write: false, format: "iife",
    jsx: "transform", target: "es2020", legalComments: "inline",
    define: { "process.env.NODE_ENV": '"production"' },
    nodePaths: [path.join(root, "node_modules")],
  });
  const js = out.outputFiles[0].text.replace(/<\/script>/gi, "<\\/script>");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>[Preview] Medra -- ${name}</title>
</head>
<body>
<div id="root"></div>
<script>
${js}
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(root, "dist", `${name}.html`), html);
  console.log(`built dist/${name}.html (${(html.length / 1024).toFixed(0)} KB)`);
}
