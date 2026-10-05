function patchV130AutoComplete(source) {
  const needle = `  const summary = base.resolveAutomatedGeneration(state);\n  const rel = base.ensureExternalRelationsState(state);\n  rel.version = V130_VERSION;\n  const effectsAfter = syncElvenSocietyEffects(state);`;
  if (!source.includes(needle)) throw new Error('Could not find v130 automated generation resolution block');
  source = source.replace(
    needle,
    `  const summary = base.resolveAutomatedGeneration(state);\n  const rel = base.ensureExternalRelationsState(state);\n  rel.version = V130_VERSION;\n  let elvenAllianceCompletion = null;\n  if (getElvenQuestStatus(state).readyToComplete) {\n    elvenAllianceCompletion = completeStrategicAlliance(state, 'elves');\n  }\n  const effectsAfter = syncElvenSocietyEffects(state);`,
  );

  const summaryNeedle = `    summary.externalRelations.version = V130_VERSION;\n    summary.externalRelations.elvenAllianceQuest = getElvenQuestStatus(state);`;
  if (!source.includes(summaryNeedle)) throw new Error('Could not find v130 external relations summary block');
  return source.replace(
    summaryNeedle,
    `    summary.externalRelations.version = V130_VERSION;\n    summary.externalRelations.levelsAfter = { ...rel.levels };\n    summary.externalRelations.elvenAllianceCompletion = elvenAllianceCompletion;\n    summary.externalRelations.elvenAllianceQuest = getElvenQuestStatus(state);`,
  );
}

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (result.format !== 'module' || result.source == null) return result;
  const pathname = new URL(url).pathname;
  if (!pathname.endsWith('/js/v130-elven-alliance-engine.js')) return result;
  let source = Buffer.isBuffer(result.source) ? result.source.toString('utf8') : String(result.source);
  source = patchV130AutoComplete(source);
  return { ...result, source, shortCircuit: true };
}
