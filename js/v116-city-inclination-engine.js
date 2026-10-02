import * as legacy from './v115-intrigue-history-sync.js?core=0.11.5-intrigue3';
import { INTRIGUE_CARD_META } from './v115-intrigue-card-catalog.js?v=0.11.5';

export * from './v115-intrigue-history-sync.js?core=0.11.5-intrigue3';

const AXIS_MIN = -2;
const AXIS_MAX = 2;

function clampAxis(value) {
  return Math.max(AXIS_MIN, Math.min(AXIS_MAX, Math.trunc(Number(value) || 0)));
}

function sign(value) {
  return value > 0 ? 1 : value < 0 ? -1 : 0;
}

function inclinationLabel(axis, value) {
  const v = clampAxis(value);
  if (axis === 'religionArcane') {
    return ({
      [-2]: 'Scholarium II',
      [-1]: 'Scholarium I',
      [0]: 'Neutral',
      [1]: 'Temple I',
      [2]: 'Temple II',
    })[v];
  }
  return ({
    [-2]: 'Military II',
    [-1]: 'Military I',
    [0]: 'Neutral',
    [1]: 'Merchant I',
    [2]: 'Merchant II',
  })[v];
}

function playedCardCounts(state, generation) {
  const counts = { temple: 0, scholarium: 0, military: 0, merchant: 0, total: 0 };
  const cards = [];

  for (const play of state.intrigue?.playHistory ?? []) {
    if (Number(play.generation) !== Number(generation)) continue;
    const definition = INTRIGUE_CARD_META[play.cardId];
    if (!definition) continue;

    let domain = null;
    if (definition.institutionId === 'temple') domain = 'temple';
    else if (definition.institutionId === 'scholarium') domain = 'scholarium';
    else if (definition.institutionId === 'city_guard') domain = 'military';
    else if (definition.institutionId === 'merchant_guild') domain = 'merchant';
    if (!domain) continue;

    counts[domain] += 1;
    counts.total += 1;
    cards.push({
      playerId: play.playerId,
      cardId: play.cardId,
      timing: play.timing ?? definition.timing,
      domain,
    });
  }

  return { counts, cards };
}

function resolveCityInclination(state, summary) {
  const generation = Number(summary?.generation ?? Math.max(0, (Number(state.generation) || 1) - 1));
  const { counts, cards } = playedCardCounts(state, generation);

  const before = {
    religionArcane: clampAxis(state.city?.religionArcane),
    militaryMercantile: clampAxis(state.city?.militaryMercantile),
  };

  // Positive religionArcane = Temple; negative = Scholarium.
  // Positive militaryMercantile = Merchant; negative = Military.
  const requestedDelta = {
    religionArcane: sign(counts.temple - counts.scholarium),
    militaryMercantile: sign(counts.merchant - counts.military),
  };

  const after = {
    religionArcane: clampAxis(before.religionArcane + requestedDelta.religionArcane),
    militaryMercantile: clampAxis(before.militaryMercantile + requestedDelta.militaryMercantile),
  };

  const actualDelta = {
    religionArcane: after.religionArcane - before.religionArcane,
    militaryMercantile: after.militaryMercantile - before.militaryMercantile,
  };

  state.city.religionArcane = after.religionArcane;
  state.city.militaryMercantile = after.militaryMercantile;

  const result = {
    generation,
    counts,
    cards,
    before,
    requestedDelta,
    actualDelta,
    after,
    labels: {
      religionArcaneBefore: inclinationLabel('religionArcane', before.religionArcane),
      religionArcaneAfter: inclinationLabel('religionArcane', after.religionArcane),
      militaryMercantileBefore: inclinationLabel('militaryMercantile', before.militaryMercantile),
      militaryMercantileAfter: inclinationLabel('militaryMercantile', after.militaryMercantile),
    },
    rule: 'relative_majority_no_threshold_max_one_step_per_axis',
  };

  summary.cityInclination = result;
  summary.phaseSequence = [...(summary.phaseSequence ?? []).filter(phase => phase !== 'CITY_INCLINATION'), 'CITY_INCLINATION'];

  const history = state.history ?? [];
  const entry = [...history].reverse().find(item => Number(item.generation) === generation);
  if (entry && entry !== summary) {
    entry.cityInclination = JSON.parse(JSON.stringify(result));
    entry.phaseSequence = [...summary.phaseSequence];
  }

  return result;
}

export function resolveAutomatedGeneration(state) {
  const summary = legacy.resolveAutomatedGeneration(state);
  resolveCityInclination(state, summary);

  // State.generation has already advanced: refresh demand/institution previews for
  // the next Generation using the newly resolved Inclination.
  legacy.applyAutoDemand(state);
  return summary;
}
