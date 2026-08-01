import { cn } from '@/lib/utils';

type BrandWordmarkProps = {
  className?: string;
  gameClassName?: string;
  maniaClassName?: string;
  ukClassName?: string;
  /** Append “ UK” after Mania */
  showUk?: boolean;
  /** Match comic logo casing (GAME / MANIA) */
  uppercase?: boolean;
  /** Insert a space between Game and Mania (logo-style) */
  spaced?: boolean;
  as?: 'span' | 'p' | 'div';
};

/**
 * Logo-matched brand mark: Game (yellow) + Mania (magenta/red).
 */
export function BrandWordmark({
  className,
  gameClassName,
  maniaClassName,
  ukClassName,
  showUk = false,
  uppercase = false,
  spaced = false,
  as: Tag = 'span',
}: BrandWordmarkProps) {
  const game = uppercase ? 'GAME' : 'Game';
  const mania = uppercase ? 'MANIA' : 'Mania';
  const label = showUk ? 'GameMania UK' : 'GameMania';

  return (
    <Tag className={cn('gm-display leading-none tracking-wide', className)} aria-label={label}>
      <span className={cn('text-[var(--gm-yellow)]', gameClassName)}>{game}</span>
      {spaced ? ' ' : null}
      <span className={cn('text-[var(--gm-magenta)]', maniaClassName)}>{mania}</span>
      {showUk ? <span className={cn('text-[var(--gm-yellow)]', ukClassName)}> UK</span> : null}
    </Tag>
  );
}
