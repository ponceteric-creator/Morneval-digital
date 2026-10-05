import { pathToFileURL } from 'node:url';
import { patchMerchantAiV136 } from './merchant-ai-v136-patch.mjs';

const ROOT = pathToFileURL(`${process.cwd()}/`).href;
function local(rel) { return new URL(rel, ROOT).href; }

export async function resolve(specifier, context, nextResolve) {
  let candidate = null;
  let parent = null;
  try { candidate = new URL(specifier, context.parentURL ?? ROOT); } catch {}
  try { parent = context.parentURL ? new URL(context.parentURL) : null; } catch {}

  // Current simulation scripts historically import v130 directly. Route only
  // those top-level script imports through the latest simulation wrapper. The
  // wrapper inherits the v131 Food cleanup, v132 Production Stake AI model,
  // v133 Influence threshold 20, v134 Investor AI replacing Dynast,
  // v135 +2 inherent Family Influence, and v136 Merchant AI correction.
  // Archived/versioned engine behavior remains untouched.
  if (candidate
      && parent?.pathname?.includes('/scripts/')
      && candidate.pathname.endsWith('/js/v130-elven-alliance-engine.js')) {
    return {
      url: `${local('js/v136-merchant-ai-engine.js')}${candidate.search || '?current=merchant-ai-v136'}`,
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (result.format !== 'module' || result.source == null) return result;
  const pathname = new URL(url).pathname;
  if (!pathname.endsWith('/js/v110-ai-engine.js')
      && !pathname.endsWith('/js/v119-political-influence-ai-engine.js')) return result;
  const source = Buffer.isBuffer(result.source) ? result.source.toString('utf8') : String(result.source);
  return { ...result, source: patchMerchantAiV136(url, source), shortCircuit: true };
}
