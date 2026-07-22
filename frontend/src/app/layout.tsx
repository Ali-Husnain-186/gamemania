import type { Metadata } from 'next';
import { Manrope, Orbitron } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
});

export const metadata: Metadata = {
  title: {
    default: 'GAME-MANIA | UK Gaming Marketplace',
    template: '%s | GAME-MANIA',
  },
  description:
    'Buy games, consoles and accessories. Trade in devices for cash or store credit. Free UK shipping on orders £60+.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${manrope.variable} ${orbitron.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
