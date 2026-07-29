import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--gm-bg)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in srgb, var(--gm-magenta) 35%, transparent), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, color-mix(in srgb, var(--gm-cyan) 25%, transparent), transparent)',
        }}
        aria-hidden
      />
      <header className="relative z-10 mx-auto flex w-full max-w-md items-center justify-center px-4 pt-10 md:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-3 gm-focus rounded-sm"
          aria-label="GAME MANIA home"
        >
          <Image
            src="/brand/game-mania-logo.png"
            alt="GAME MANIA"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
          />
          <span className="gm-display text-2xl leading-none">
            <span className="text-[var(--gm-yellow)]">GAME</span>{' '}
            <span className="text-[var(--gm-magenta)]">MANIA</span>
          </span>
        </Link>
      </header>
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
