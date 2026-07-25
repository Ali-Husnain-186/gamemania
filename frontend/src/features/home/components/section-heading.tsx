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
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-8 sm:gap-4">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gm-cyan)] sm:text-[11px]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="gm-display mt-1 text-[1.35rem] leading-tight text-[var(--gm-yellow)] sm:text-3xl md:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--gm-muted)] sm:mt-2 sm:text-base">
            {description}
          </p>
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
