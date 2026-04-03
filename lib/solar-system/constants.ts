/** Scene radii (visual scale, not to scale). */
export const SUN_RADIUS = 3.2;

export const ORBIT = {
  mercury: 7,
  venus: 9,
  /** Mean black moon Lilith–style point (~1 au, ~8.85 y visual period). */
  lilith: 11.5,
  earth: 12,
  mars: 15,
  /** Main-belt asteroid Juno (~4.36 y). */
  juno: 17.5,
  jupiter: 21,
  saturn: 27,
  /** Centaur Chiron (~50.7 y). */
  chiron: 30,
  uranus: 33,
  neptune: 39,
} as const;

/** Planet mesh radii (exaggerated for visibility). */
export const BODY_RADIUS = {
  mercury: 0.17,
  venus: 0.25,
  lilith: 0.085,
  earth: 0.24,
  mars: 0.19,
  juno: 0.098,
  jupiter: 1.05,
  saturn: 0.88,
  chiron: 0.11,
  uranus: 0.42,
  neptune: 0.41,
  moon: 0.08,
} as const;

/** Orbital period relative to Earth (1 Earth year = 1). */
export const ORBITAL_PERIOD_YEARS = {
  mercury: 0.241,
  venus: 0.615,
  lilith: 8.85,
  earth: 1,
  mars: 1.881,
  juno: 4.36,
  jupiter: 11.86,
  saturn: 29.46,
  chiron: 50.7,
  uranus: 84.01,
  neptune: 164.8,
} as const;

/** Seconds of real time for one simulated Earth orbit. */
export const EARTH_YEAR_SECONDS = 36;

/** Spin rate multiplier vs realistic sidereal ratios (visual only). */
export const SPIN_BOOST = 48;

/**
 * Extra dampening for planetary axial rotation only (orbits and moon use {@link ANIMATION_SPEED} only).
 * Lower = slower spin on each planet’s axis.
 */
export const PLANET_SPIN_SCALE = 0.1;

/** Scales orbits, axial rotation, and moon motion together. Lower = slower. */
export const ANIMATION_SPEED = 0.38;

/** Initial mean anomaly offset per planet (visual only), radians added to longitude. */
export const ORBIT_PHASE = {
  mercury: 1.2,
  venus: 2.1,
  lilith: 5.0,
  earth: 0,
  mars: 4.2,
  juno: 1.5,
  jupiter: 0.7,
  saturn: 3.3,
  chiron: 3.9,
  uranus: 5.1,
  neptune: 2.8,
} as const;

export type PlanetKey = keyof typeof ORBIT;

/** Stable order for rings, aspects, and UI. */
export const PLANETS_IN_ORDER: PlanetKey[] = [
  'mercury',
  'venus',
  'lilith',
  'earth',
  'mars',
  'juno',
  'jupiter',
  'saturn',
  'chiron',
  'uranus',
  'neptune',
];

/** Textured map planets only; lilith / juno / chiron use solid materials in the scene. */
export const MINOR_BODY_HEX = {
  lilith: '#6d28d9',
  juno: '#a8a29e',
  chiron: '#2dd4bf',
} as const;

export type OrbiterId = PlanetKey | 'moon';

/** Planets plus moon (heliocentric longitude from projected XZ). */
export const ORBITERS_IN_ORDER: OrbiterId[] = [...PLANETS_IN_ORDER, 'moon'];

export type HoverBodyId = 'sun' | OrbiterId;

export const TEXTURES = {
  sun: '/solar-system/textures/sun.jpg',
  mercury: '/solar-system/textures/mercury.jpg',
  venus: '/solar-system/textures/venus.jpg',
  earthDay: '/solar-system/textures/earth_day_4096.jpg',
  earthNormal: '/solar-system/textures/earth_normal_2048.jpg',
  earthClouds: '/solar-system/textures/earth_clouds_1024.png',
  moon: '/solar-system/textures/moon_1024.jpg',
  mars: '/solar-system/textures/mars.jpg',
  jupiter: '/solar-system/textures/jupiter.jpg',
  saturn: '/solar-system/textures/saturn.jpg',
  saturnRing: '/solar-system/textures/saturn_ring.png',
  uranus: '/solar-system/textures/uranus.jpg',
  neptune: '/solar-system/textures/neptune.jpg',
} as const;
