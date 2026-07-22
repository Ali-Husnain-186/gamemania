/**
 * Admin foundation shell — full modules in later phases.
 */
export default function AdminHomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--admin-accent)]">
        Admin Console
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">GAME-MANIA</h1>
      <p className="mt-4 max-w-xl text-[var(--admin-muted)]">
        Operations dashboard scaffold is ready. Catalog, orders, trade-in, CMS, and RBAC modules
        will be built module-by-module after API auth lands.
      </p>
      <dl className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ['API', process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'],
          ['Phase', 'Foundation (M1)'],
          ['Access', 'Staff roles only'],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4"
          >
            <dt className="text-xs uppercase tracking-wider text-[var(--admin-muted)]">{label}</dt>
            <dd className="mt-2 break-all font-mono text-sm">{value}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
