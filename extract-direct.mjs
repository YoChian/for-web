// 临时工具：绕过 lingui CLI，直接用 babel + 抽取插件拿到精确 msgid 清单
// 用法: node extract-direct.mjs
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { createRequire } from "node:module";

const root = join(import.meta.dirname, "packages/client");
const R = createRequire(import.meta.url);
const { transformSync } = R(join(import.meta.dirname,
  "node_modules/.pnpm/@babel+core@7.27.1/node_modules/@babel/core"));
const presetTs = join(import.meta.dirname,
  "node_modules/.pnpm/@babel+preset-typescript@7.27.1_@babel+core@7.27.1/node_modules/@babel/preset-typescript");
const extractPlugin = join(import.meta.dirname,
  "packages/js-lingui-solid/packages/babel-plugin-extract-messages/dist/index.cjs");
const macroPlugin = join(import.meta.dirname,
  "packages/js-lingui-solid/packages/babel-plugin-lingui-macro/dist/index.cjs");

const messages = new Map();
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (["node_modules", "catalogs", ".git", "dist"].includes(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(name)) extractFile(p);
  }
}
function extractFile(p) {
  const code = readFileSync(p, "utf-8");
  try {
    transformSync(code, {
      filename: p,
      configFile: false,
      babelrc: false,
      presets: [[presetTs, { isTSX: true, allExtensions: true }]],
      plugins: [
        [macroPlugin, {
          corePackage: ["@lingui-solid/solid"],
          jsxPackage: ["@lingui-solid/solid/macro"],
          extract: true,
        }],
        [extractPlugin, {
          onMessageExtracted(msg) {
            messages.set(msg.id, { message: msg.message, file: relative(root, p) });
          },
        }],
      ],
      code: false,
    });
  } catch (e) {
    console.error("PARSE_FAIL", relative(root, p), String(e).split("\n")[0]);
  }
}
walk(join(root, "src"));
walk(join(root, "components"));
const out = {};
for (const [id, v] of messages) out[id] = v;
writeFileSync(join(import.meta.dirname, "extracted-ids.json"), JSON.stringify(out, null, 1), "utf-8");
console.error("total messages:", messages.size);
