// Morneval v0.11.5 Intrigue catalogue — active tabletop composition.
// LOW / MID / HIGH are balancing metadata only, not rules.

const card = (id, name, institutionId, timing, nature, power, copies, influenceCost, extra = {}) => Object.freeze({
  id, name, institutionId, timing, nature, power, copies, influenceCost,
  unique: false, permanent: false, implemented: true, ...extra,
  tags: Object.freeze([nature.toLowerCase(), power.toLowerCase(), ...(extra.tags ?? [])]),
});

export const ACTIVE_INTRIGUE_CARDS = Object.freeze([
  // Merchant Guild — 32
  card('criminal_network','Criminal Network','merchant_guild','action','Bonus','LOW',4,0,{tags:['prestige_cost','influence_gain']}),
  card('hostile_takeover','Hostile Takeover','merchant_guild','action','Attack','MID',4,1,{tags:['stake','auction']}),
  card('binding_bids','Binding Bids','merchant_guild','action','Bonus','LOW',4,1,{tags:['stake','auction','all_pay']}),
  card('line_of_credit','Line of Credit','merchant_guild','action','Bonus','MID',4,1,{tags:['temporary_influence','debt']}),
  card('preferential_contracts','Preferential Contracts','merchant_guild','action','Bonus','LOW',4,1,{tags:['external_demand','allocation']}),
  card('private_buyer','Private Buyer','merchant_guild','action','Bonus','LOW',4,1,{tags:['external_demand']}),
  card('misdirection','Misdirection / Straw Man','merchant_guild','reaction','Defense','MID',4,3,{tags:['redirect']}),
  card('audit_license_privileges','Audit of License Privileges','merchant_guild','action','Attack','LOW',4,1,{tags:['agents','tax']}),

  // Military — 35
  card('gemstone_vein','Gemstone Vein','city_guard','action','Bonus','HIGH',1,4,{unique:true,permanent:true,targetTerrain:'hill',tags:['land_improvement','wealth']}),
  card('rare_breed','Rare Breed','city_guard','action','Bonus','HIGH',1,4,{unique:true,permanent:true,targetTerrain:'meadow',tags:['land_improvement','wealth']}),
  card('precious_timber','Precious Timber','city_guard','action','Bonus','HIGH',1,4,{unique:true,permanent:true,targetTerrain:'forest',tags:['land_improvement','wealth']}),
  card('assassination','Assassination','city_guard','action','Attack','MID',5,3,{tags:['agent','dynasty']}),
  card('bodyguards','Bodyguards','city_guard','reaction','Defense','LOW',6,2,{tags:['dynasty','assassination']}),
  card('land_seizure','Land Seizure','city_guard','action','Attack','MID',5,2,{tags:['land','domain_cost']}),
  card('martial_law','Martial Law','city_guard','action','Bonus','LOW',6,1,{tags:['order','prestige']}),
  card('officer_purge','Officer Purge / Loyalty Commission','city_guard','action','Attack','LOW',6,1,{tags:['agents','tax']}),
  card('contingency_reserves','Contingency Reserves','city_guard','action','Bonus','LOW',4,1,{tags:['food','reserve','prestige']}),

  // Scholarium — 36
  card('advanced_farming_techniques','Advanced Farming Techniques','scholarium','action','Bonus','HIGH',1,4,{unique:true,permanent:true,tags:['patent','food','wealth']}),
  card('civic_sanitation_works','Civic Sanitation Works','scholarium','action','Bonus','HIGH',1,4,{unique:true,permanent:true,tags:['patent','squalor','wealth']}),
  card('advanced_judicial_system','Advanced Judicial System','scholarium','action','Bonus','HIGH',1,4,{unique:true,permanent:true,tags:['patent','order','wealth']}),
  card('advanced_architecture','Advanced Architecture','scholarium','action','Bonus','HIGH',1,4,{unique:true,permanent:true,tags:['patent','urban_capacity','wealth']}),
  card('spy_network','Spy Network / Intelligence','scholarium','action','Attack','MID',4,1,{tags:['hand','variable_cost']}),
  card('counter_intelligence','Counter-Intelligence','scholarium','reaction','Defense','MID',5,2,{tags:['cancel']}),
  card('technological_acceleration','Technological Acceleration','scholarium','action','Bonus','LOW',4,1,{tags:['development','prestige']}),
  card('experimental_methods','Experimental Methods','scholarium','action','Bonus','LOW',6,1,{tags:['raw_capacity','prestige']}),
  card('expose_charlatans','Expose the Charlatans','scholarium','action','Attack','LOW',3,2,{tags:['agents','tax']}),
  card('insider_information','Insider Information / Bid Advantage','scholarium','action','Bonus','LOW',6,0,{tags:['auction','bid_only']}),
  card('dark_magic','Dark Magic','scholarium','action','Bonus','MID',4,0,{tags:['prestige_cost','influence_gain']}),

  // Temple — 32
  card('infernal_pact','Infernal Pact','temple','action','Bonus','LOW',4,0,{tags:['prestige_cost','influence_gain']}),
  card('hunt_heretics','Hunt the Heretics','temple','action','Attack','LOW',4,2,{tags:['agents','tax']}),
  card('threat_excommunication','Threat of Excommunication','temple','action','Attack','LOW',4,1,{tags:['influence_loss','prestige_loss']}),
  card('anathema','Anathema','temple','action','Attack','HIGH',1,3,{tags:['agent','prestige_loss']}),
  card('alms_poor','Alms for the Poor','temple','action','Bonus','LOW',6,1,{tags:['squalor','prestige']}),
  card('ecclesiastical_confiscation','Ecclesiastical Confiscation','temple','action','Attack','MID',4,2,{tags:['land','city']}),
  card('public_absolution','Public Absolution','temple','reaction','Defense','LOW',4,1,{tags:['prestige_loss']}),
  card('legal_contestation','Legal Contestation','temple','action','Attack','MID',4,2,{tags:['patent','auction']}),
  card('crooked_notary','Crooked Notary','temple','action','Attack','HIGH',1,4,{tags:['patent','steal']}),
]);

export const INTRIGUE_CARD_META = Object.freeze(Object.fromEntries(ACTIVE_INTRIGUE_CARDS.map(c => [c.id, c])));
export function getActiveIntrigueCardDefinitions() {
  return ACTIVE_INTRIGUE_CARDS.map(c => ({...c, tags:[...c.tags]}));
}
