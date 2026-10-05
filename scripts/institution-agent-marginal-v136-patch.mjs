// v136 AI-only correction for Institution Agent valuation.
// Current rules (v121+) award Institution Prestige once per represented Family,
// not once per Agent, and cap Agent-generated Influence by Institution Tier.
// v110 predates both rules and therefore overvalues stacking Agents in one Institution.

function patchInstitutionAgentMarginals(source) {
  if (source.includes('function v136MarginalInstitutionPrestige')) return source;

  const marker = 'function normalizedAgentComponents(state, player, agent, profile, seniority, t) {';
  const index = source.indexOf(marker);
  if (index < 0) throw new Error('Missing normalizedAgentComponents in v110');

  const helper = `function v136InstitutionTier(state,institutionId){
  const institution=(state.institutions ?? []).find(row=>row.id===institutionId);
  return Math.max(1,Math.min(3,Math.floor(Number(institution?.tier)||1)));
}
function v136InstitutionInfluenceCap(state,institutionId){
  const tier=v136InstitutionTier(state,institutionId);
  return ({1:2,2:4,3:8})[tier] ?? 2;
}
function v136SameInstitutionAgents(player,institutionId){
  return getInstitutionAgentRoster(player).filter(row=>row.institutionId===institutionId);
}
function v136MarginalInstitutionPrestige(player,agent,institutionScore){
  const peers=v136SameInstitutionAgents(player,agent.institutionId);
  const existing=peers.includes(agent);
  const otherCount=existing?Math.max(0,peers.length-1):peers.length;
  // v121+ single-association rule: the Family receives the Institution score once
  // if represented. A first Agent unlocks it; another Agent adds no extra Prestige.
  return otherCount>0?0:Math.max(0,Number(institutionScore)||0);
}
function v136ProjectedOtherInstitutionInfluence(player,agent,t){
  let total=0;
  for(const other of v136SameInstitutionAgents(player,agent.institutionId)){
    if(other===agent)continue;
    const projected=Math.min(3,Math.max(1,Math.floor(Number(other.seniority)||1)+Math.max(0,Math.floor(Number(t)||0))));
    total+=projected;
  }
  return total;
}
function v136MarginalInstitutionInfluence(state,player,agent,seniority,t){
  const cap=v136InstitutionInfluenceCap(state,agent.institutionId);
  const other=v136ProjectedOtherInstitutionInfluence(player,agent,t);
  const own=Math.max(0,Math.floor(Number(seniority)||0));
  return Math.max(0,Math.min(cap,other+own)-Math.min(cap,other));
}

`;

  source = source.slice(0, index) + helper + source.slice(index);

  const oldScore = '  const institutionScore = estimatedInstitutionScore(state, agent.institutionId);';
  const newScore = `  const rawInstitutionScore = estimatedInstitutionScore(state, agent.institutionId);\n  const institutionScore = v136MarginalInstitutionPrestige(player, agent, rawInstitutionScore);`;
  if (!source.includes(oldScore)) throw new Error('Missing v110 Agent institution score line');
  source = source.replace(oldScore, newScore);

  const oldInfluence = '    influence: Math.min(1.5, Math.max(0, seniority * influenceValue / influenceRef)),';
  const newInfluence = `    influence: Math.min(1.5, Math.max(0, v136MarginalInstitutionInfluence(state, player, agent, seniority, t) * influenceValue / influenceRef)),`;
  if (!source.includes(oldInfluence)) throw new Error('Missing v110 Agent influence component line');
  source = source.replace(oldInfluence, newInfluence);

  return source;
}

export function patchInstitutionAgentMarginalV136(url, source) {
  if (process.env.MERCHANT_AI_V136 === 'off') return source;
  if (process.env.INSTITUTION_AGENT_MARGINAL_V136 === 'off') return source;
  const pathname = new URL(url).pathname;
  if (!pathname.endsWith('/js/v110-ai-engine.js')) return source;
  return patchInstitutionAgentMarginals(source);
}
