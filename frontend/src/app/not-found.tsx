import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="gm-display text-sm tracking-[0.2em] text-[var(--gm-accent)]">404</p>
      <h1 className="mt-3 text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-[var(--gm-muted)]">That route doesn’t exist in GAME-MANIA.</p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-[var(--gm-accent)] px-5 py-2.5 text-sm font-semibold text-[#042016]"
      >
        Back home
      </Link>
    </div>
  );
}
