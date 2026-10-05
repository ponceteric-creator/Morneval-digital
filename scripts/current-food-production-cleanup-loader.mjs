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
  // v133 Influence threshold 20, v134 Investor AI replacing Dynast,
  // v135 +2 inherent Family Influence, and v136 Agent/commerce AI corrections.
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

// The experimental v136 political-intent patch was rejected by A/B testing:
// it raised commercial Wealth but transferred too much advantage to the
// Contrarian. Current simulation therefore retains the legacy v119 political
// intent while v136 fixes only objective valuation errors.
