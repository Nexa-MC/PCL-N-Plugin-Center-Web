import { readFile } from 'node:fs/promises';
import ts from 'typescript';
let instance = 0;
export async function loadPlatform(t) {
  const previousWindow = globalThis.window, redirects = [];
  globalThis.window = { location: { origin: 'https://pcln.top', assign: value => redirects.push(value) }, dispatchEvent() {} };
  t.after(() => { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; });
  const path = new URL('../src/api/platform.ts', import.meta.url);
  const source = (await readFile(path, 'utf8')).replace('import.meta.env.DEV', 'false').replace("'../utils/waffoCheckout.ts'", JSON.stringify(new URL('../src/utils/waffoCheckout.ts', import.meta.url).href));
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const module = await import(`data:text/javascript;base64,${Buffer.from(compiled + `\n// fixture ${++instance}`).toString('base64')}`);
  return { ...module, redirects };
}
