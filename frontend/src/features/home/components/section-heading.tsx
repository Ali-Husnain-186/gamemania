import Link from 'next/link';

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = 'View all',
}: SectionHeadingProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--gm-cyan)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="gm-display mt-1 text-2xl text-[var(--gm-yellow)] sm:text-3xl md:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm text-[var(--gm-muted)] sm:text-base">{description}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="text-sm font-bold text-[var(--gm-cyan)] transition hover:text-[var(--gm-yellow)] gm-focus rounded-sm"
        >
          {linkLabel} →
        </Link>
      ) : null}
    </div>
  );
}
