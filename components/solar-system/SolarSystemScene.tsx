'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls, Stars, useTexture } from '@react-three/drei';
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import {
  ANIMATION_SPEED,
  BODY_RADIUS,
  MINOR_BODY_HEX,
  ORBIT,
  PLANETS_IN_ORDER,
  PLANET_SPIN_SCALE,
  SPIN_BOOST,
  SUN_RADIUS,
  TEXTURES,
  type HoverBodyId,
  type OrbiterId,
  type PlanetKey,
} from '@/lib/solar-system/constants';
import {
  aspectLineColor,
  aspectsFromOrbiterGeo,
  aspectsFromSunGeo,
  formatPeakCalendarDays,
  nextAspectPeakTimeGeo,
  nextSunOrbiterAspectPeakTimeGeo,
  separationBetweenOrbitersGeo,
  separationSunOrbiterGeo,
  type MajorAspectKind,
} from '@/lib/solar-system/heliocentricAspects';
import {
  julianCenturiesUTC,
  moonWorldXZ,
  sceneMoonOffsetXZ,
  sceneOrbitXZ,
} from '@/lib/solar-system/solarEphemeris';

const CHORD_Y = 0.055;

/** Line2 width in world units (reliable on Apple; pixel linewidth is often clamped to 1). */
const CHORD_LINE_WIDTH_WORLD = 0.11;

function aspectsNotInvolvingEarth(rows: { other: OrbiterId; kind: MajorAspectKind }[]): typeof rows {
  return rows.filter((r) => r.other !== 'earth');
}

/** Outside Neptune (~39); decorative only. */
const SPACESHIP_ORBIT_MIN = 52;
const SPACESHIP_HULL_SCALE = 1.35;

function CuteSpaceshipHull({ color }: { color: string }) {
  const hullMat = {
    color,
    metalness: 0.38,
    roughness: 0.4,
    emissive: color,
    emissiveIntensity: 0.12,
  } as const;
  return (
    <group scale={SPACESHIP_HULL_SCALE}>
      <mesh position={[0.36, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.14, 0.4, 10]} />
        <meshStandardMaterial {...hullMat} emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[-0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.11, 0.13, 0.5, 12]} />
        <meshStandardMaterial {...hullMat} />
      </mesh>
      <mesh position={[-0.08, 0, 0.2]} rotation={[0.25, 0, 0.12]}>
        <boxGeometry args={[0.32, 0.05, 0.16]} />
        <meshStandardMaterial {...hullMat} />
      </mesh>
      <mesh position={[-0.08, 0, -0.2]} rotation={[-0.25, 0, -0.12]}>
        <boxGeometry args={[0.32, 0.05, 0.16]} />
        <meshStandardMaterial {...hullMat} />
      </mesh>
      <mesh position={[-0.22, 0.14, 0]} rotation={[0, 0, 0.85]}>
        <boxGeometry args={[0.12, 0.2, 0.06]} />
        <meshStandardMaterial {...hullMat} />
      </mesh>
      <mesh position={[0.08, 0.09, 0.07]}>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshStandardMaterial
          color="#e0f2fe"
          emissive="#bae6fd"
          emissiveIntensity={0.9}
          metalness={0.2}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0.08, -0.06, -0.06]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color="#fef3c7"
          emissive="#fde68a"
          emissiveIntensity={0.75}
          metalness={0.15}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[-0.34, 0, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#67e8f9"
          emissiveIntensity={1.1}
          metalness={0.15}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}

function FlyingCuteSpaceship({
  color,
  radius,
  speed,
  phase,
  yAmp,
  yFreq,
  planeTiltX,
  planeTiltZ,
}: {
  color: string;
  radius: number;
  speed: number;
  phase: number;
  yAmp: number;
  yFreq: number;
  planeTiltX: number;
  planeTiltZ: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const tilt = useMemo(
    () => new THREE.Euler(planeTiltX, 0, planeTiltZ, 'XYZ'),
    [planeTiltX, planeTiltZ],
  );
  const v = useMemo(() => new THREE.Vector3(), []);
  const e = useMemo(() => new THREE.Euler(0, 0, 0, 'XYZ'), []);

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime * speed + phase;
    const flatX = radius * Math.cos(t);
    const flatZ = radius * Math.sin(t);
    const y = yAmp * Math.sin(clock.elapsedTime * yFreq + phase * 1.7);
    v.set(flatX, y, flatZ);
    v.applyEuler(tilt);
    g.position.copy(v);
    e.set(0, -t + Math.PI * 0.5 + planeTiltZ * 0.35, planeTiltX * 0.2, 'YXZ');
    g.rotation.copy(e);
  });

  return (
    <group ref={ref}>
      <CuteSpaceshipHull color={color} />
    </group>
  );
}

function DistantSpaceships() {
  return (
    <group>
      <FlyingCuteSpaceship
        color="#fb923c"
        radius={SPACESHIP_ORBIT_MIN + 6}
        speed={0.09}
        phase={0.4}
        yAmp={2.4}
        yFreq={0.62}
        planeTiltX={0.22}
        planeTiltZ={0.35}
      />
      <FlyingCuteSpaceship
        color="#a5b4fc"
        radius={SPACESHIP_ORBIT_MIN + 22}
        speed={-0.075}
        phase={2.1}
        yAmp={3.8}
        yFreq={0.48}
        planeTiltX={-0.18}
        planeTiltZ={-0.42}
      />
      <FlyingCuteSpaceship
        color="#f472b6"
        radius={SPACESHIP_ORBIT_MIN + 38}
        speed={0.055}
        phase={4.6}
        yAmp={3.1}
        yFreq={0.38}
        planeTiltX={0.14}
        planeTiltZ={0.55}
      />
    </group>
  );
}

/** Icy nucleus + soft tail pointing radially away from the sun (decorative). */
function DecorativeComet({
  radius,
  speed,
  phase,
  yAmp,
  yFreq,
  planeTiltX,
  planeTiltZ,
  tailColor,
  nucleusScale = 1,
}: {
  radius: number;
  speed: number;
  phase: number;
  yAmp: number;
  yFreq: number;
  planeTiltX: number;
  planeTiltZ: number;
  tailColor: string;
  nucleusScale?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const tilt = useMemo(
    () => new THREE.Euler(planeTiltX, 0, planeTiltZ, 'XYZ'),
    [planeTiltX, planeTiltZ],
  );
  const v = useMemo(() => new THREE.Vector3(), []);
  const radial = useMemo(() => new THREE.Vector3(), []);
  const yAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime * speed + phase;
    const flatX = radius * Math.cos(t);
    const flatZ = radius * Math.sin(t);
    const y = yAmp * Math.sin(clock.elapsedTime * yFreq + phase * 1.3);
    v.set(flatX, y, flatZ);
    v.applyEuler(tilt);
    g.position.copy(v);
    radial.copy(v);
    if (radial.lengthSq() < 1e-8) return;
    radial.normalize();
    g.quaternion.setFromUnitVectors(yAxis, radial);
  });

  const ns = 0.26 * nucleusScale;
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[ns, 16, 16]} />
        <meshStandardMaterial
          color="#f0f9ff"
          emissive="#c7d2fe"
          emissiveIntensity={0.55}
          metalness={0.12}
          roughness={0.42}
        />
      </mesh>
      <mesh position={[0, 0.48, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.24, 1.35, 14]} />
        <meshBasicMaterial
          color={tailColor}
          transparent
          opacity={0.38}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function DistantComets() {
  return (
    <group>
      <DecorativeComet
        radius={96}
        speed={0.15}
        phase={0.9}
        yAmp={4.2}
        yFreq={0.52}
        planeTiltX={0.28}
        planeTiltZ={-0.4}
        tailColor="#67e8f9"
        nucleusScale={1}
      />
      <DecorativeComet
        radius={112}
        speed={-0.12}
        phase={3.4}
        yAmp={5.5}
        yFreq={0.4}
        planeTiltX={-0.24}
        planeTiltZ={0.48}
        tailColor="#d8b4fe"
        nucleusScale={0.92}
      />
      <DecorativeComet
        radius={128}
        speed={0.11}
        phase={5.8}
        yAmp={3.6}
        yFreq={0.58}
        planeTiltX={0.16}
        planeTiltZ={0.62}
        tailColor="#fde047"
        nucleusScale={1.05}
      />
    </group>
  );
}

const RAD_TO_DEG = 180 / Math.PI;

function formatSeparationDeg(separationRad: number): string {
  return `${(separationRad * RAD_TO_DEG).toFixed(1)}°`;
}

function HoverSunToOrbiterRow({
  T,
  other,
  kind,
}: {
  T: number;
  other: OrbiterId;
  kind: MajorAspectKind;
}) {
  const sep = separationSunOrbiterGeo(T, other);
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- stable T from hover snapshot
  const tPeak = useMemo(() => nextSunOrbiterAspectPeakTimeGeo(T, other, kind), [T, other, kind]);
  return (
    <li className="whitespace-nowrap font-mono text-[0.52rem] lowercase leading-snug">
      <span className="text-violet-100/90">
        sun — {other}:{' '}
      </span>
      <span style={{ color: aspectLineColor(kind) }} className="font-semibold">
        {kind}
      </span>
      <span className="text-violet-200/75"> {formatSeparationDeg(sep)} · </span>
      <span className="text-violet-200/60">{formatPeakCalendarDays(T, tPeak)}</span>
    </li>
  );
}

function HoverBodyAspectRow({
  T,
  anchor,
  other,
  kind,
}: {
  T: number;
  anchor: OrbiterId;
  other: OrbiterId;
  kind: MajorAspectKind;
}) {
  const sep = separationBetweenOrbitersGeo(T, anchor, other);
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- stable T from hover snapshot
  const tPeak = useMemo(() => nextAspectPeakTimeGeo(T, anchor, other, kind), [T, anchor, other, kind]);
  return (
    <li className="whitespace-nowrap font-mono text-[0.52rem] lowercase leading-snug">
      <span className="text-violet-100/90">{other}: </span>
      <span style={{ color: aspectLineColor(kind) }} className="font-semibold">
        {kind}
      </span>
      <span className="text-violet-200/75"> {formatSeparationDeg(sep)} · </span>
      <span className="text-violet-200/60">{formatPeakCalendarDays(T, tPeak)}</span>
    </li>
  );
}

function useSrgbTexture(url: string) {
  const [source] = useTexture([url]);
  const tex = useMemo(() => {
    const c = source.clone();
    c.colorSpace = THREE.SRGBColorSpace;
    c.anisotropy = 8;
    return c;
  }, [source]);
  useLayoutEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function OrbitPath({
  radius,
  color,
  opacity,
  y = 0.028,
}: {
  radius: number;
  color: string;
  opacity: number;
  y?: number;
}) {
  const geo = useMemo(() => {
    const n = 160;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [radius, y]);
  useLayoutEffect(() => () => geo.dispose(), [geo]);
  return (
    <lineLoop geometry={geo}>
      <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </lineLoop>
  );
}

function HoverHit({
  body,
  hitRadius,
  setHovered,
  children,
}: {
  body: HoverBodyId;
  hitRadius: number;
  setHovered: Dispatch<SetStateAction<HoverBodyId | null>>;
  children: React.ReactNode;
}) {
  return (
    <group>
      {children}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(body);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered((h) => (h === body ? null : h));
        }}
      >
        <sphereGeometry args={[hitRadius, 20, 20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Local surface point (rotates with the sun); slightly outside the sphere to avoid z-fighting. */
const SUN_FACE_ANCHOR_LOCAL = new THREE.Vector3(0, 0.22, 1)
  .normalize()
  .multiplyScalar(SUN_RADIUS * 1.05);

const SUN_FACE_NORMAL = SUN_FACE_ANCHOR_LOCAL.clone().normalize();

/** Tangent plane: local +Z → outward normal so eyes/smile sit on the limb. */
const SUN_FACE_QUAT = new THREE.Quaternion().setFromUnitVectors(
  new THREE.Vector3(0, 0, 1),
  SUN_FACE_NORMAL,
);

const SUN_WORLD = new THREE.Vector3(0, 0, 0);

/**
 * Sun at origin; OrbitControls target defaults to origin — distance ≈ zoom level.
 * ~42 needs a clear zoom-in from the default ~57; tune if needed.
 */
const SUN_FACE_MAX_CAMERA_DISTANCE = 42;

function SunCuteFace() {
  const { camera } = useThree();
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);

  useFrame(() => {
    const dist = camera.position.distanceTo(SUN_WORLD);
    const next = dist < SUN_FACE_MAX_CAMERA_DISTANCE;
    if (next !== visibleRef.current) {
      visibleRef.current = next;
      setVisible(next);
    }
  });

  const smilePoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const deg = 208 + u * 124;
      const rad = (deg * Math.PI) / 180;
      const r = 0.46;
      pts.push(new THREE.Vector3(r * Math.cos(rad), r * Math.sin(rad) - 0.06, 0.04));
    }
    return pts;
  }, []);

  if (!visible) return null;

  return (
    <group position={SUN_FACE_ANCHOR_LOCAL} quaternion={SUN_FACE_QUAT}>
      <group scale={0.72}>
        <mesh position={[-0.4, 0.22, 0]} renderOrder={1}>
          <circleGeometry args={[0.13, 24]} />
          <meshBasicMaterial
            color="#3d2918"
            depthWrite={false}
            depthTest
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
        <mesh position={[0.4, 0.22, 0]} renderOrder={1}>
          <circleGeometry args={[0.13, 24]} />
          <meshBasicMaterial
            color="#3d2918"
            depthWrite={false}
            depthTest
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
        <mesh position={[-0.34, 0.28, 0.002]} scale={[1, 1.15, 1]} renderOrder={1}>
          <circleGeometry args={[0.04, 12]} />
          <meshBasicMaterial color="#fff5e0" depthWrite={false} depthTest />
        </mesh>
        <mesh position={[0.46, 0.28, 0.002]} scale={[1, 1.15, 1]} renderOrder={1}>
          <circleGeometry args={[0.04, 12]} />
          <meshBasicMaterial color="#fff5e0" depthWrite={false} depthTest />
        </mesh>
        <Line
          points={smilePoints}
          color="#4a321f"
          lineWidth={2.25}
          transparent
          opacity={0.95}
          depthWrite={false}
          depthTest
          renderOrder={1}
        />
      </group>
    </group>
  );
}

function SunBody({ spinY }: { spinY: number }) {
  const map = useSrgbTexture(TEXTURES.sun);
  return (
    <group rotation={[0, spinY, 0]}>
      <mesh>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={map}
          emissive="#ffcc44"
          emissiveIntensity={1.35}
          roughness={0.85}
          metalness={0}
        />
      </mesh>
      <SunCuteFace />
    </group>
  );
}

function TexturedPlanet({
  radius,
  textureUrl,
  roughness = 0.76,
  metalness = 0.04,
}: {
  radius: number;
  textureUrl: string;
  roughness?: number;
  metalness?: number;
}) {
  const map = useSrgbTexture(textureUrl);
  return (
    <mesh>
      <sphereGeometry args={[radius, 96, 96]} />
      <meshStandardMaterial map={map} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

function MinorBody({ radius, color }: { radius: number; color: string }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 48, 48]} />
      <meshStandardMaterial color={color} roughness={0.62} metalness={0.1} />
    </mesh>
  );
}

function SaturnWithRings() {
  const [bodySrc, ringSrc] = useTexture([TEXTURES.saturn, TEXTURES.saturnRing]);
  const body = useMemo(() => {
    const c = bodySrc.clone();
    c.colorSpace = THREE.SRGBColorSpace;
    c.anisotropy = 8;
    return c;
  }, [bodySrc]);
  const ring = useMemo(() => {
    const c = ringSrc.clone();
    c.colorSpace = THREE.SRGBColorSpace;
    c.anisotropy = 4;
    return c;
  }, [ringSrc]);
  useLayoutEffect(
    () => () => {
      body.dispose();
      ring.dispose();
    },
    [body, ring],
  );

  const r = BODY_RADIUS.saturn;
  return (
    <group rotation={[0.35, 0, 0]}>
      <mesh>
        <sphereGeometry args={[r, 96, 96]} />
        <meshStandardMaterial map={body} roughness={0.74} metalness={0.04} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r * 1.25, r * 2.45, 96]} />
        <meshStandardMaterial
          map={ring}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          opacity={0.95}
          roughness={0.8}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

function EarthGlobe({ radius }: { radius: number }) {
  const [daySrc, normalSrc, cloudsSrc] = useTexture([
    TEXTURES.earthDay,
    TEXTURES.earthNormal,
    TEXTURES.earthClouds,
  ]);

  const day = useMemo(() => {
    const c = daySrc.clone();
    c.colorSpace = THREE.SRGBColorSpace;
    c.anisotropy = 16;
    return c;
  }, [daySrc]);
  const normal = useMemo(() => {
    const c = normalSrc.clone();
    c.colorSpace = THREE.LinearSRGBColorSpace;
    c.anisotropy = 8;
    return c;
  }, [normalSrc]);
  const clouds = useMemo(() => {
    const c = cloudsSrc.clone();
    c.colorSpace = THREE.SRGBColorSpace;
    c.anisotropy = 8;
    return c;
  }, [cloudsSrc]);

  useLayoutEffect(
    () => () => {
      day.dispose();
      normal.dispose();
      clouds.dispose();
    },
    [day, normal, clouds],
  );

  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshStandardMaterial
          map={day}
          normalMap={normal}
          roughness={0.5}
          metalness={0.08}
          normalScale={new THREE.Vector2(0.55, 0.55)}
        />
      </mesh>
      <mesh scale={1.008} raycast={() => null}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={clouds}
          transparent
          opacity={0.82}
          depthWrite={false}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

function MoonMesh() {
  const map = useSrgbTexture(TEXTURES.moon);
  return (
    <mesh>
      <sphereGeometry args={[BODY_RADIUS.moon, 32, 32]} />
      <meshStandardMaterial map={map} roughness={0.8} metalness={0} />
    </mesh>
  );
}

const chordLineProps = {
  lineWidth: CHORD_LINE_WIDTH_WORLD,
  worldUnits: true,
  transparent: true,
  opacity: 0.98,
  depthWrite: false,
  depthTest: false,
  toneMapped: false,
} as const;

/** Scene XZ for chord endpoints (matches planet groups / sun / moon world position). */
function chordBodyAnchorXZ(
  body: HoverBodyId,
  planetXZ: Record<PlanetKey, { x: number; z: number }>,
  moonXZ: { x: number; z: number },
): { x: number; z: number } {
  if (body === 'sun') return { x: 0, z: 0 };
  if (body === 'moon') return moonXZ;
  return planetXZ[body as PlanetKey];
}

function HoverChordLines({
  hovered,
  T,
  planetXZ,
  moonXZ,
}: {
  hovered: HoverBodyId | null;
  T: number;
  planetXZ: Record<PlanetKey, { x: number; z: number }>;
  moonXZ: { x: number; z: number };
}) {
  if (!hovered || hovered === 'earth') return null;

  const anchor = (body: HoverBodyId) => chordBodyAnchorXZ(body, planetXZ, moonXZ);

  if (hovered === 'sun') {
    const rows = aspectsFromSunGeo(T);
    return (
      <>
        {rows.map(({ other, kind }) => {
          const a = anchor('sun');
          const b = anchor(other);
          return (
            <Line
              key={`sun-${other}-${kind}`}
              points={[
                [a.x, CHORD_Y, a.z],
                [b.x, CHORD_Y, b.z],
              ]}
              color={aspectLineColor(kind)}
              {...chordLineProps}
            />
          );
        })}
      </>
    );
  }

  const rows = aspectsNotInvolvingEarth(aspectsFromOrbiterGeo(T, hovered as OrbiterId));
  const from = anchor(hovered);
  return (
    <>
      {rows.map(({ other, kind }) => {
        const to = anchor(other);
        return (
          <Line
            key={`${hovered}-${other}-${kind}`}
            points={[
              [from.x, CHORD_Y, from.z],
              [to.x, CHORD_Y, to.z],
            ]}
            color={aspectLineColor(kind)}
            {...chordLineProps}
          />
        );
      })}
    </>
  );
}

function HoverAspectPanel({ hovered, T }: { hovered: HoverBodyId | null; T: number }) {
  const [snap, setSnap] = useState<{ body: HoverBodyId | null; T: number }>({
    body: null,
    T: 0,
  });

  useLayoutEffect(() => {
    if (hovered == null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- freeze Julian T when hover target changes
    setSnap((s) => (s.body === hovered ? s : { body: hovered, T }));
  }, [hovered, T]);

  if (!hovered) return null;
  if (hovered === 'earth') return null;

  const t = snap.body === hovered ? snap.T : T;

  if (hovered === 'sun') {
    const rows = aspectsFromSunGeo(t);
    return (
      <Html transform={false} fullscreen style={{ pointerEvents: 'none' }}>
        <div className="pointer-events-none absolute right-3 top-1/2 z-10 max-h-[min(72vh,30rem)] w-[min(96vw,23rem)] -translate-y-1/2 overflow-y-auto rounded-xl border border-violet-500/30 bg-black/70 px-3 py-2.5 text-xs text-violet-100 shadow-lg backdrop-blur-md sm:right-5">
          <p className="m-0 mb-2 font-bold lowercase text-violet-200">sun</p>
          {rows.length === 0 ? (
            <p className="m-0 text-[0.52rem] text-violet-200/55">no major aspect within orb</p>
          ) : (
            <ul className="m-0 list-none space-y-1.5 overflow-x-auto p-0">
              {rows.map(({ other, kind }) => (
                <HoverSunToOrbiterRow key={`sun-${other}-${kind}`} T={t} other={other} kind={kind} />
              ))}
            </ul>
          )}
        </div>
      </Html>
    );
  }

  const rows = aspectsNotInvolvingEarth(aspectsFromOrbiterGeo(t, hovered as OrbiterId));
  return (
    <Html transform={false} fullscreen style={{ pointerEvents: 'none' }}>
      <div className="pointer-events-none absolute right-3 top-1/2 z-10 max-h-[min(72vh,30rem)] w-[min(96vw,23rem)] -translate-y-1/2 overflow-y-auto rounded-xl border border-violet-500/30 bg-black/70 px-3 py-2.5 text-xs text-violet-100 shadow-lg backdrop-blur-md sm:right-5">
        <p className="m-0 mb-2 font-bold lowercase text-violet-200">{hovered}</p>
        {rows.length === 0 ? (
          <p className="m-0 text-[0.52rem] text-violet-200/55">no major aspect within orb</p>
        ) : (
          <ul className="m-0 list-none space-y-1.5 overflow-x-auto p-0">
            {rows.map(({ other, kind }) => (
              <HoverBodyAspectRow
                key={`${hovered}-${other}-${kind}`}
                T={t}
                anchor={hovered as OrbiterId}
                other={other}
                kind={kind}
              />
            ))}
          </ul>
        )}
      </div>
    </Html>
  );
}

export function SolarSystemScene() {
  const [t, setT] = useState(0);
  const [hovered, setHovered] = useState<HoverBodyId | null>(null);
  const [ephemerisDate, setEphemerisDate] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => {
      setEphemerisDate(new Date());
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useFrame((_, delta) => {
    setT((prev) => prev + delta);
  });

  const tSim = t * ANIMATION_SPEED;

  const spin = (mult = 1) => tSim * SPIN_BOOST * 0.22 * PLANET_SPIN_SCALE * mult;

  const T = useMemo(() => julianCenturiesUTC(ephemerisDate), [ephemerisDate]);

  const pos = useMemo(() => {
    const out = {} as Record<PlanetKey, { x: number; z: number }>;
    for (const p of PLANETS_IN_ORDER) {
      out[p] = sceneOrbitXZ(T, p);
    }
    return out;
  }, [T]);

  const moonOff = useMemo(() => sceneMoonOffsetXZ(T), [T]);
  const moonChordXZ = moonWorldXZ(T, pos.earth, spin(1));

  return (
    <>
      <color attach="background" args={['#03030a']} />
      <ambientLight intensity={0.28} />
      <hemisphereLight args={['#c8d4ff', '#0a0814', 0.42]} />
      <pointLight position={[0, 0, 0]} intensity={108} decay={2} distance={980} color="#fff5e6" />

      <Stars radius={520} depth={90} count={12000} factor={3.5} saturation={0} fade speed={0.4} />

      <DistantSpaceships />
      <DistantComets />

      {PLANETS_IN_ORDER.map((planet) => (
        <OrbitPath
          key={`ring-${planet}`}
          radius={ORBIT[planet]}
          color="#4c3d6b"
          opacity={0.38}
          y={0.026}
        />
      ))}

      <HoverChordLines hovered={hovered} T={T} planetXZ={pos} moonXZ={moonChordXZ} />
      <HoverAspectPanel hovered={hovered} T={T} />

      <HoverHit body="sun" hitRadius={SUN_RADIUS * 2.35} setHovered={setHovered}>
        <SunBody spinY={spin(1.15)} />
      </HoverHit>

      <group position={[pos.mercury.x, 0, pos.mercury.z]}>
        <group rotation={[0, spin(2.1), 0]}>
          <HoverHit body="mercury" hitRadius={BODY_RADIUS.mercury * 2.8} setHovered={setHovered}>
            <TexturedPlanet radius={BODY_RADIUS.mercury} textureUrl={TEXTURES.mercury} />
          </HoverHit>
        </group>
      </group>

      <group position={[pos.venus.x, 0, pos.venus.z]}>
        <group rotation={[0, spin(-1.4), 0]}>
          <HoverHit body="venus" hitRadius={BODY_RADIUS.venus * 2.7} setHovered={setHovered}>
            <TexturedPlanet radius={BODY_RADIUS.venus} textureUrl={TEXTURES.venus} />
          </HoverHit>
        </group>
      </group>

      <group position={[pos.lilith.x, 0, pos.lilith.z]}>
        <group rotation={[0, spin(1.3), 0]}>
          <HoverHit body="lilith" hitRadius={BODY_RADIUS.lilith * 4} setHovered={setHovered}>
            <MinorBody radius={BODY_RADIUS.lilith} color={MINOR_BODY_HEX.lilith} />
          </HoverHit>
        </group>
      </group>

      <group position={[pos.earth.x, 0, pos.earth.z]}>
        <group rotation={[0, spin(1), 0.409]}>
          <HoverHit body="earth" hitRadius={BODY_RADIUS.earth * 2.6} setHovered={setHovered}>
            <EarthGlobe radius={BODY_RADIUS.earth} />
          </HoverHit>
          <group position={[moonOff.x, 0, moonOff.z]}>
            <HoverHit body="moon" hitRadius={BODY_RADIUS.moon * 4} setHovered={setHovered}>
              <MoonMesh />
            </HoverHit>
          </group>
        </group>
      </group>

      <group position={[pos.mars.x, 0, pos.mars.z]}>
        <group rotation={[0, spin(1.8), 0]}>
          <HoverHit body="mars" hitRadius={BODY_RADIUS.mars * 2.8} setHovered={setHovered}>
            <TexturedPlanet radius={BODY_RADIUS.mars} textureUrl={TEXTURES.mars} />
          </HoverHit>
        </group>
      </group>

      <group position={[pos.juno.x, 0, pos.juno.z]}>
        <group rotation={[0, spin(2), 0]}>
          <HoverHit body="juno" hitRadius={BODY_RADIUS.juno * 4} setHovered={setHovered}>
            <MinorBody radius={BODY_RADIUS.juno} color={MINOR_BODY_HEX.juno} />
          </HoverHit>
        </group>
      </group>

      <group position={[pos.jupiter.x, 0, pos.jupiter.z]}>
        <group rotation={[0, spin(3.2), 0]}>
          <HoverHit body="jupiter" hitRadius={BODY_RADIUS.jupiter * 2.2} setHovered={setHovered}>
            <TexturedPlanet radius={BODY_RADIUS.jupiter} textureUrl={TEXTURES.jupiter} />
          </HoverHit>
        </group>
      </group>

      <group position={[pos.saturn.x, 0, pos.saturn.z]}>
        <group rotation={[0, spin(2.6), 0]}>
          <HoverHit body="saturn" hitRadius={BODY_RADIUS.saturn * 4.2} setHovered={setHovered}>
            <SaturnWithRings />
          </HoverHit>
        </group>
      </group>

      <group position={[pos.chiron.x, 0, pos.chiron.z]}>
        <group rotation={[0, spin(1.1), 0]}>
          <HoverHit body="chiron" hitRadius={BODY_RADIUS.chiron * 4} setHovered={setHovered}>
            <MinorBody radius={BODY_RADIUS.chiron} color={MINOR_BODY_HEX.chiron} />
          </HoverHit>
        </group>
      </group>

      <group position={[pos.uranus.x, 0, pos.uranus.z]}>
        <group rotation={[0, spin(-1.1), 0]}>
          <HoverHit body="uranus" hitRadius={BODY_RADIUS.uranus * 2.9} setHovered={setHovered}>
            <TexturedPlanet radius={BODY_RADIUS.uranus} textureUrl={TEXTURES.uranus} />
          </HoverHit>
        </group>
      </group>

      <group position={[pos.neptune.x, 0, pos.neptune.z]}>
        <group rotation={[0, spin(1.5), 0]}>
          <HoverHit body="neptune" hitRadius={BODY_RADIUS.neptune * 2.9} setHovered={setHovered}>
            <TexturedPlanet radius={BODY_RADIUS.neptune} textureUrl={TEXTURES.neptune} />
          </HoverHit>
        </group>
      </group>

      <OrbitControls
        enablePan
        enableDamping
        dampingFactor={0.06}
        minDistance={8}
        maxDistance={240}
        rotateSpeed={0.55}
        zoomSpeed={0.7}
      />
    </>
  );
}
