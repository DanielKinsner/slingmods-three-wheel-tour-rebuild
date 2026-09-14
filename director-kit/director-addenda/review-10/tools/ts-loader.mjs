// Diagnostic loader: transpile provided TypeScript, resolve bundler-style relative imports.
// Does not modify submitted source and does not substitute for a tsc/Vite build.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
export async function resolve(specifier, context, nextResolve) {
  if ((specifier.startsWith('.') || specifier.startsWith('/')) && context.parentURL) {
    const base = new URL(specifier, context.parentURL);
    if (base.protocol === 'file:') {
      const path = fileURLToPath(base);
      for (const suffix of ['', '.ts', '.js', '/index.ts', '/index.js']) {
        const candidate = path + suffix;
        if (existsSync(candidate) && /\.(ts|js|json|mjs)$/.test(candidate))
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
  }
  return nextResolve(specifier, context);
}
export async function load(url, context, nextLoad) {
  if (url.startsWith('file:') && url.endsWith('.ts')) {
    const text = await readFile(new URL(url), 'utf8');
    return { format: 'module', source: stripTypeScriptTypes(text, {mode:'transform', sourceUrl: url}), shortCircuit: true };
  }
  if (url.startsWith('file:') && url.endsWith('.json')) {
    const text = await readFile(new URL(url), 'utf8');
    JSON.parse(text);
    return { format:'module', source:`export default ${text};`, shortCircuit:true };
  }
  return nextLoad(url, context);
}
