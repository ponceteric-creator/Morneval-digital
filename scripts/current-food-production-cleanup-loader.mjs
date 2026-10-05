import { pathToFileURL } from 'node:url';

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
  // v133 Influence threshold 20, v134 Investor AI replacing Dynast, and
  // v135 +2 inherent Family Influence at the start of each generation.
  // Archived/versioned engine behavior remains untouched.
  if (candidate
      && parent?.pathname?.includes('/scripts/')
      && candidate.pathname.endsWith('/js/v130-elven-alliance-engine.js')) {
    return {
      url: `${local('js/v135-family-influence-engine.js')}${candidate.search || '?current=family-influence-v135'}`,
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}
