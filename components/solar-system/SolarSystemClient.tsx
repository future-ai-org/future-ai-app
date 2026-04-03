'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

import { SolarSystemScene } from '@/components/solar-system/SolarSystemScene';

export default function SolarSystemClient() {
  return (
    <div className="relative h-[min(72dvh,640px)] w-full min-h-[420px] overflow-hidden rounded-xl border border-border bg-[#03030a] shadow-md sm:h-[min(78dvh,720px)] sm:min-h-[480px]">
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center text-sm text-violet-200/80">
            loading...
          </div>
        }
      >
        <Canvas
          className="h-full w-full"
          camera={{ position: [0, 30, 48], fov: 60, near: 0.2, far: 4000 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
        >
          <SolarSystemScene />
        </Canvas>
      </Suspense>
    </div>
  );
}
