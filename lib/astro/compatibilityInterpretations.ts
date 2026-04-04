import type { PlanetName } from './types';

/** What each planet represents in compatibility (your planet "colours" their house). */
const PLANET_MEANINGS: Record<PlanetName, string> = {
  Sun: 'identity, vitality, and core self',
  Moon: 'emotions, needs, and nurturing style',
  Mercury: 'communication, thinking, and day-to-day exchange',
  Venus: 'love, attraction, and what you value in relationship',
  Mars: 'drive, passion, and how you take action',
  Jupiter: 'expansion, optimism, and growth',
  Saturn: 'structure, responsibility, and lasting lessons',
  Uranus: 'unexpected change, originality, and freedom',
  Neptune: 'ideals, compassion, and subtle bonds',
  Pluto: 'transformation, depth, and intensity',
};

/** What each house represents in the other person's chart (area of their life). */
const HOUSE_MEANINGS: Record<number, string> = {
  1: 'self, identity, and first impression',
  2: 'values, money, and what they hold dear',
  3: 'communication, siblings, and local environment',
  4: 'home, family, and emotional roots',
  5: 'romance, creativity, and self-expression',
  6: 'health, service, and daily routine',
  7: 'partnership, marriage, and one-to-one relationships',
  8: 'shared resources, intimacy, and transformation',
  9: 'beliefs, travel, and higher meaning',
  10: 'career, reputation, and public role',
  11: 'friends, groups, and hopes for the future',
  12: 'subconscious, solitude, and what\'s hidden',
};

/**
 * Returns a short compatibility explanation: "Your [planet meaning] touches their [house meaning]."
 */
/**
 * Classic compatibility: generally harmonious planet–house pairs (score boost).
 */
const HARMONIOUS: Record<PlanetName, number[]> = {
  Sun: [1, 5, 7, 10, 11],
  Moon: [4, 5, 7, 11],
  Mercury: [3, 7, 11],
  Venus: [2, 5, 7, 11],
  Mars: [1, 5, 8],
  Jupiter: [2, 5, 7, 9, 11],
  Saturn: [4, 10],
  Uranus: [11],
  Neptune: [4, 7, 12],
  Pluto: [8],
};

/**
 * Often challenging or intense planet–house pairs (score reduction).
 */
const CHALLENGING: Record<PlanetName, number[]> = {
  Sun: [6, 12],
  Moon: [6, 8, 12],
  Mercury: [6, 12],
  Venus: [6, 8, 12],
  Mars: [6, 12],
  Jupiter: [6, 8, 12],
  Saturn: [6, 7, 8, 12],
  Uranus: [4, 8, 12],
  Neptune: [6, 8],
  Pluto: [4, 6, 12],
};

const BASE_SCORE = 5;
const SIGN_INDEX = (lon: number) => Math.floor(lon / 30) % 12;

/** Zodiac sign index (0–11) to element. Fire: 0,4,8; Earth: 1,5,9; Air: 2,6,10; Water: 3,7,11. */
export type Element = 'fire' | 'earth' | 'air' | 'water';
const SIGN_ELEMENTS: Element[] = [
  'fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water',
];

/** Same element (strongest ease); earth–water and fire–air (good complementary pairs); else no elemental harmony. */
export type ElementRelation = 'same' | 'complementary' | 'none';

export function getElementRelation(elA: Element, elB: Element): ElementRelation {
  if (elA === elB) return 'same';
  if ((elA === 'earth' && elB === 'water') || (elA === 'water' && elB === 'earth')) return 'complementary';
  if ((elA === 'fire' && elB === 'air') || (elA === 'air' && elB === 'fire')) return 'complementary';
  return 'none';
}

/** True when {@link getElementRelation} is same or complementary. */
export function elementsCompatible(elA: Element, elB: Element): boolean {
  return getElementRelation(elA, elB) !== 'none';
}

export function getElementForSign(signIndex: number): Element {
  return SIGN_ELEMENTS[signIndex % 12] ?? 'fire';
}

export interface PlacementScore {
  score: number;
  label: 'high' | 'medium' | 'low';
  note: string;
}

/** Planets that have the same sign in both charts (from aInB = chart A planets, bInA = chart B planets). */
export function getSameSignPlanets(
  aInB: { planet: { name: string; longitude: number } }[],
  bInA: { planet: { name: string; longitude: number } }[],
): Set<PlanetName> {
  const signA = new Map<string, number>();
  const signB = new Map<string, number>();
  aInB.forEach((r) => signA.set(r.planet.name, SIGN_INDEX(r.planet.longitude)));
  bInA.forEach((r) => signB.set(r.planet.name, SIGN_INDEX(r.planet.longitude)));
  const same = new Set<PlanetName>();
  signA.forEach((sign, name) => {
    if (signB.get(name) === sign) same.add(name as PlanetName);
  });
  return same;
}

/** Per-planet elemental harmony between the two charts (symmetric in A/B). */
export function getElementRelationPerPlanet(
  aInB: { planet: { name: string; longitude: number } }[],
  bInA: { planet: { name: string; longitude: number } }[],
): Map<PlanetName, ElementRelation> {
  const signA = new Map<string, number>();
  const signB = new Map<string, number>();
  aInB.forEach((r) => signA.set(r.planet.name, SIGN_INDEX(r.planet.longitude)));
  bInA.forEach((r) => signB.set(r.planet.name, SIGN_INDEX(r.planet.longitude)));
  const out = new Map<PlanetName, ElementRelation>();
  signA.forEach((sign, name) => {
    const other = signB.get(name);
    if (other === undefined) return;
    out.set(
      name as PlanetName,
      getElementRelation(getElementForSign(sign), getElementForSign(other)),
    );
  });
  return out;
}

const SAME_ELEMENT_SCORE_BOOST = 3;
/** Earth–water and fire–air pairs use a fixed per-planet score (see {@link getSymmetricPlacementScore}). */
const COMPLEMENTARY_ELEMENT_PLACEMENT_SCORE = 8;

function houseScoreDelta(planetName: PlanetName, house: number): number {
  let d = 0;
  if (HARMONIOUS[planetName]?.includes(house)) d += 2;
  if (CHALLENGING[planetName]?.includes(house)) d -= 2;
  if ([5, 7, 8].includes(house) && ['Venus', 'Moon', 'Sun'].includes(planetName)) d += 1;
  return d;
}

function elementNote(relation: ElementRelation): string | null {
  if (relation === 'same') return 'Same element — very natural rapport';
  if (relation === 'complementary')
    return 'Earth supports water (and vice versa); fire and air energise each other';
  return null;
}

/**
 * One score per planet for both compatibility tables: averages house effects from
 * "A's planet in B's house" and "B's planet in A's house", then applies elemental tier
 * (same element strongest; earth–water and fire–air a fixed 8/10).
 */
export function getSymmetricPlacementScore(
  planetName: PlanetName,
  houseAPlanetInB: number,
  houseBPlanetInA: number,
  sameSignPlanets?: Set<PlanetName>,
  elementRelation: ElementRelation = 'none',
): PlacementScore {
  if (sameSignPlanets?.has(planetName)) {
    return { score: 10, label: 'high', note: 'Same sign — strong resonance' };
  }

  const houseBlend =
    (houseScoreDelta(planetName, houseAPlanetInB) + houseScoreDelta(planetName, houseBPlanetInA)) / 2;
  const hb = Math.round(houseBlend);
  /** Positive blends step down by one so a mild +1 blend reads 5/10, not 6/10. */
  const houseContribution = hb <= 0 ? hb : hb - 1;
  let score = BASE_SCORE + houseContribution;
  if (elementRelation === 'same') score += SAME_ELEMENT_SCORE_BOOST;
  else if (elementRelation === 'complementary') score = COMPLEMENTARY_ELEMENT_PLACEMENT_SCORE;
  score = Math.max(1, Math.min(10, score));

  const label: PlacementScore['label'] =
    score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low';
  const notes: Record<PlacementScore['label'], string> = {
    high: 'Strong synergy',
    medium: 'Neutral to mixed',
    low: 'May need awareness',
  };
  const elementLine = elementNote(elementRelation);
  const note = elementLine ?? notes[label];
  return { score, label, note };
}

export function getCompatibilityExplanation(
  planetName: PlanetName,
  house: number,
): string {
  const planet = PLANET_MEANINGS[planetName] ?? planetName.toLowerCase();
  const houseMeaning = HOUSE_MEANINGS[house] ?? `house ${house}`;
  return `Your ${planet} touches their ${houseMeaning}.`;
}

/**
 * Single row blurb for the score-adjacent column: planet meaning once, both
 * cross-chart houses (avoids repeating the same planet line under A and B).
 */
export function getMergedCrossChartExplanation(
  planetName: PlanetName,
  houseAPlanetInB: number,
  houseBPlanetInA: number,
  chartALabel: string,
  chartBLabel: string,
): string {
  const planet = PLANET_MEANINGS[planetName] ?? planetName.toLowerCase();
  const areaB = HOUSE_MEANINGS[houseAPlanetInB] ?? `house ${houseAPlanetInB}`;
  const areaA = HOUSE_MEANINGS[houseBPlanetInA] ?? `house ${houseBPlanetInA}`;
  if (houseAPlanetInB === houseBPlanetInA) {
    return `${planetName} (${planet}) meets the same life area in both charts (${areaB}).`;
  }
  return `${chartALabel}'s ${planetName} (${planet}) colours ${chartBLabel}'s ${areaB}. ${chartBLabel}'s ${planetName} colours ${chartALabel}'s ${areaA}.`;
}

const ALL_PLANETS_COUNT = 10;

/**
 * Overall compatibility from average of all placement scores (0–100).
 * If both charts have exactly the same sign for every planet, returns 100.
 */
export function getOverallScore(
  aInB: { planet: { name: string; longitude: number }; house: number }[],
  bInA: { planet: { name: string; longitude: number }; house: number }[],
): { scoreOutOf100: number; label: string; summary: string } {
  const sameSignPlanets = getSameSignPlanets(aInB, bInA);
  if (sameSignPlanets.size === ALL_PLANETS_COUNT) {
    return {
      scoreOutOf100: 100,
      label: 'High compatibility',
      summary:
        'Every planet is in the same sign in both charts — strong natural resonance and understanding between you.',
    };
  }

  const elementRelationByPlanet = getElementRelationPerPlanet(aInB, bInA);
  const houseBinA = new Map(bInA.map((r) => [r.planet.name, r.house]));
  const scores = aInB.map((r) => {
    const name = r.planet.name as PlanetName;
    const hAB = r.house;
    const hBA = houseBinA.get(r.planet.name);
    if (hBA === undefined) return BASE_SCORE;
    return getSymmetricPlacementScore(
      name,
      hAB,
      hBA,
      sameSignPlanets,
      elementRelationByPlanet.get(name) ?? 'none',
    ).score;
  });
  const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  const scoreOutOf100 = Math.round((avg / 10) * 100);

  let label: string;
  let summary: string;
  if (scoreOutOf100 >= 70) {
    label = 'High compatibility';
    summary =
      'These two charts blend well overall. Many placements support rapport, romance, or partnership. Pay attention to the lower-scoring placements for growth.';
  } else if (scoreOutOf100 >= 50) {
    label = 'Moderate compatibility';
    summary =
      'A mix of easy and challenging energy. You can build a strong connection by honouring differences and the areas that need more care.';
  } else {
    label = 'Strong potential with effort';
    summary =
      'Compatibility shows more friction or intensity. With awareness and willingness to work on the tougher placements, the connection can deepen.';
  }
  return { scoreOutOf100, label, summary };
}

export { PLANET_MEANINGS, HOUSE_MEANINGS };
