import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'solar system — future',
  description: 'Interactive 3D solar system with textured planets and orbit controls.',
};

export default function SolarSystemLayout({ children }: { children: React.ReactNode }) {
  return children;
}
