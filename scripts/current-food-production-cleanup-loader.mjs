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
  // wrapper inherits the v131 Food cleanup and v132 Production Stake AI model,
  // then raises the Influence erosion threshold from 12 to 20 in v133.
  // Archived/versioned engine behavior remains untouched.
  if (candidate
      && parent?.pathname?.includes('/scripts/')
      && candidate.pathname.endsWith('/js/v130-elven-alliance-engine.js')) {
    return {
      url: `${local('js/v133-influence-cap-engine.js')}${candidate.search || '?current=influence-cap-v133'}`,
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}
