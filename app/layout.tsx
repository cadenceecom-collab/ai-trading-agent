import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Trading Agent',
  description: 'Standalone AI-assisted stock and crypto trading control center.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
