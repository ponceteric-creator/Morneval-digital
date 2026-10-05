import { pathToFileURL } from 'node:url';

const ROOT = pathToFileURL(`${process.cwd()}/`).href;
function local(rel) { return new URL(rel, ROOT).href; }

export async function resolve(specifier, context, nextResolve) {
  let candidate = null;
  let parent = null;
  try { candidate = new URL(specifier, context.parentURL ?? ROOT); } catch {}
  try { parent = context.parentURL ? new URL(context.parentURL) : null; } catch {}

  // Current simulation scripts historically import v130 directly. Route only
  // those top-level script imports through v131. The v131 module itself still
  // imports v130 as its base, so archived/versioned engine behavior is untouched.
  if (candidate
      && parent?.pathname?.includes('/scripts/')
      && candidate.pathname.endsWith('/js/v130-elven-alliance-engine.js')) {
    return {
      url: `${local('js/v131-food-production-cleanup-engine.js')}${candidate.search || '?current=food-cleanup'}`,
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}
