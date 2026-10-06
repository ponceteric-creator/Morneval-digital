
import * as esbuild from 'esbuild';
import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = pathToFileURL(process.cwd() + path.sep).href;
const LOADER_FILES = [
  './development-cost-loader.mjs',
  './external-relations-loader.mjs',
  './elven-alliance-sim-loader.mjs',
  './elven-strategy-ai-loader.mjs',
  './elven-quest-autocomplete-loader.mjs',
  './fortification-sim-loader.mjs',
  './production-stake-ai-v132-loader.mjs',
  './investor-ai-v134-loader.mjs',
  './current-food-production-cleanup-loader.mjs',
];

const loaderModules = [];
for (const rel of LOADER_FILES) {
  loaderModules.push(await import(new URL(rel, import.meta.url)));
}

function baseResolve(specifier, context = {}) {
  if (specifier.startsWith('node:')) return { url: specifier };
  const parentURL = context.parentURL || ROOT;
  return { url: new URL(specifier, parentURL).href };
}

async function chainedResolve(index, specifier, context = {}) {
  if (index < 0) return baseResolve(specifier, context);
  const hook = loaderModules[index]?.resolve;
  if (typeof hook !== 'function') return chainedResolve(index - 1, specifier, context);
  return hook(specifier, context, (nextSpecifier = specifier, nextContext = context) =>
    chainedResolve(index - 1, nextSpecifier, nextContext));
}

async function baseLoad(url) {
  if (url.startsWith('node:')) return { format: 'builtin', source: '' };
  const source = await readFile(fileURLToPath(url), 'utf8');
  return { format: 'module', source };
}

async function chainedLoad(index, url, context = {}) {
  if (index < 0) return baseLoad(url);
  const hook = loaderModules[index]?.load;
  if (typeof hook !== 'function') return chainedLoad(index - 1, url, context);
  return hook(url, context, (nextUrl = url, nextContext = context) =>
    chainedLoad(index - 1, nextUrl, nextContext));
}

function mornevalLoaderPlugin() {
  return {
    name: 'morneval-node-loader-parity',
    setup(build) {
      build.onResolve({ filter: /.*/ }, async args => {
        if (args.path.startsWith('node:')) return { path: args.path, external: true };
        const parentURL = args.importer
          ? (args.namespace === 'morneval-loader' ? args.importer : pathToFileURL(args.importer).href)
          : ROOT;
        const resolved = await chainedResolve(loaderModules.length - 1, args.path, {
          parentURL,
          conditions: args.kind === 'entry-point' ? ['import'] : ['browser','import'],
        });
        if (!resolved?.url) throw new Error('Could not resolve ' + args.path);
        if (resolved.url.startsWith('node:')) return { path: resolved.url, external: true };
        return { path: resolved.url, namespace: 'morneval-loader' };
      });

      build.onLoad({ filter: /.*/, namespace: 'morneval-loader' }, async args => {
        const loaded = await chainedLoad(loaderModules.length - 1, args.path, { format: 'module' });
        return {
          contents: String(loaded.source ?? ''),
          loader: 'js',
          resolveDir: path.dirname(fileURLToPath(args.path)),
        };
      });
    },
  };
}

async function buildBrowser() {
  await rm('dist/playtest', { recursive: true, force: true });
  await mkdir('dist/playtest', { recursive: true });

  await esbuild.build({
    entryPoints: ['js/playtest-app.js'],
    outfile: 'dist/playtest/playtest-app.js',
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['safari17'],
    minify: false,
    sourcemap: true,
    plugins: [mornevalLoaderPlugin()],
    logLevel: 'info',
  });

  const html = (await readFile('playtest.html','utf8'))
    .replace('./js/playtest-app.js?v=0.1.0','./playtest-app.js');
  await writeFile('dist/playtest/index.html', html);
  await copyFile('playtest.css','dist/playtest/playtest.css');
}

async function buildParityTest() {
  await esbuild.build({
    entryPoints: ['scripts/test-human-playtest-v138.mjs'],
    outfile: 'dist/playtest-parity-test.mjs',
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: ['node20'],
    plugins: [mornevalLoaderPlugin()],
    logLevel: 'info',
  });
}

await buildBrowser();
await buildParityTest();
console.log(JSON.stringify({
  built: true,
  costMode: process.env.COST_MODE ?? 'baseline',
  merchantAi: process.env.MERCHANT_AI ?? 'legacy',
  loaderCount: loaderModules.length,
}));
