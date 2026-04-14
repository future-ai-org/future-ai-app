import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'dashboard — future',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
