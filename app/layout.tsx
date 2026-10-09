import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Trading Agent',
  description: 'Standalone AI-assisted stocks and crypto trading dashboard',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
