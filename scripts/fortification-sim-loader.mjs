function patchFortificationAI(source) {
  const insertBefore = `function collectNormalCandidates(state, player, farmBuilt) {`;
  if (!source.includes(insertBefore)) throw new Error('Could not find collectNormalCandidates in v110 AI engine');
  const candidateFunction = `function fortificationCandidate(state, player) {\n  if (!state.externalRelations?.active || Number(state.externalRelations?.levels?.orcs) >= 0) return null;\n  const level = Math.max(0, Math.min(3, Math.floor(Number(state.city?.fortificationLevel) || 0)));\n  if (level >= 3) return null;\n  const nextLevel = level + 1;\n  const influenceCost = ({ 1: 2, 2: 3, 3: 4 })[nextLevel];\n  const prestige = ({ 1: 2, 2: 3, 3: 4 })[nextLevel];\n  const forceTrack = [0, 1, 3, 6];\n  const forceGain = forceTrack[nextLevel] - forceTrack[level];\n  if (player.influence < influenceCost) return null;\n  const profile = profileFor(state, player);\n  const orcPressure = Math.max(1, -Number(state.externalRelations?.levels?.orcs || 0));\n  const score = prestige * profile.prestige\n    + forceGain * (profile.civic * 0.85 + orcPressure * 0.85)\n    - influenceCost * 0.45;\n  return score >= V090_CONFIG.actionUtilityFloor\n    ? { kind: "fortification", score, nextLevel, influenceCost, prestige, forceGain }\n    : null;\n}\n\n`;
  source = source.replace(insertBefore, candidateFunction + insertBefore);

  const farmLine = `  const farm = farmCandidate(state, player, farmBuilt); if (farm) candidates.push(farm);`;
  if (!source.includes(farmLine)) throw new Error('Could not find farm candidate line in v110 AI engine');
  source = source.replace(
    farmLine,
    `  const fortification = fortificationCandidate(state, player); if (fortification) candidates.push(fortification);\n${farmLine}`,
  );

  const executeNeedle = `if (candidate.kind === "development") {`;
  if (!source.includes(executeNeedle)) throw new Error('Could not find development execution branch in v110 AI engine');
  const execution = `if (candidate.kind === "fortification") {\n    if (player.influence < candidate.influenceCost) return null;\n    const currentLevel = Math.max(0, Math.min(3, Math.floor(Number(state.city?.fortificationLevel) || 0)));\n    if (candidate.nextLevel !== currentLevel + 1 || candidate.nextLevel > 3) return null;\n    player.influence -= candidate.influenceCost;\n    state.city.fortificationLevel = candidate.nextLevel;\n    currentForce(state);\n    return { sequence, type: "fortification_construction", actionKind: "fortification_construction",\n      playerId: player.id, newLevel: candidate.nextLevel, influenceCost: candidate.influenceCost,\n      prestigeAward: candidate.prestige, forceGain: candidate.forceGain, forceAfter: state.city.force };\n  }\n  `;
  source = source.replace(executeNeedle, execution + executeNeedle);

  const prestigeLine = `    if (action.type === "sector_development") add(action.playerId, Number(action.prestige) || 0, "sector_development");`;
  if (!source.includes(prestigeLine)) throw new Error('Could not find sector-development Prestige line in v110 AI engine');
  source = source.replace(
    prestigeLine,
    `${prestigeLine}\n    if (action.type === "fortification_construction") add(action.playerId, Number(action.prestigeAward) || 0, "fortification_construction");`,
  );
  return source;
}

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (result.format !== 'module' || result.source == null) return result;
  const pathname = new URL(url).pathname;
  if (!pathname.endsWith('/js/v110-ai-engine.js')) return result;
  let source = Buffer.isBuffer(result.source) ? result.source.toString('utf8') : String(result.source);
  source = patchFortificationAI(source);
  return { ...result, source, shortCircuit: true };
}
