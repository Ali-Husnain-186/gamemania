import Image from 'next/image';
import { BrandWordmark } from '@/components/brand/brand-wordmark';
import { cn } from '@/lib/utils';

type BrandLoaderProps = {
  /** fullscreen = covers viewport; page = section-sized; inline = compact spinner; overlay = absolute cover */
  variant?: 'fullscreen' | 'page' | 'inline' | 'overlay';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  /** Hide brand wordmark on very tight spaces */
  showWordmark?: boolean;
};

const SIZE = {
  sm: { logo: 40, ring: 72, word: 'text-sm' },
  md: { logo: 72, ring: 120, word: 'text-lg sm:text-xl' },
  lg: { logo: 96, ring: 168, word: 'text-xl sm:text-2xl' },
} as const;

/**
 * Animated GAME MANIA logo loader — cyan/magenta/yellow orbit rings + pulsing mark.
 */
export function BrandLoader({
  variant = 'page',
  size = 'md',
  label = 'Loading…',
  className,
  showWordmark = true,
}: BrandLoaderProps) {
  const s = SIZE[size];

  const core = (
    <div
      className="gm-loader relative flex flex-col items-center justify-center gap-3 sm:gap-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div
        className="relative"
        style={{ width: s.ring, height: s.ring, maxWidth: '42vw', maxHeight: '42vw' }}
      >
        <span className="gm-loader-ring gm-loader-ring--outer" aria-hidden />
        <span className="gm-loader-ring gm-loader-ring--mid" aria-hidden />
        <span className="gm-loader-ring gm-loader-ring--inner" aria-hidden />
        <span className="gm-loader-glow" aria-hidden />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="gm-loader-logo relative overflow-hidden rounded-full border-2 border-[var(--gm-cyan)]/50 bg-black shadow-[0_0_28px_rgba(1,166,194,0.35)]">
            <Image
              src="/brand/game-mania-logo-tab.png"
              alt=""
              width={s.logo}
              height={s.logo}
              priority
              className="h-auto w-auto object-cover"
              style={{
                width: `min(${s.logo}px, 22vw)`,
                height: `min(${s.logo}px, 22vw)`,
              }}
            />
          </div>
        </div>
      </div>

      {showWordmark ? (
        <div className="text-center">
          <BrandWordmark as="p" uppercase spaced className={cn('gm-loader-wordmark', s.word)} />
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--gm-cyan)] sm:mt-2 sm:text-xs">
            {label}
          </p>
        </div>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );

  if (variant === 'fullscreen') {
    return (
      <div
        className={cn(
          'fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(5,8,12,0.88)] px-4 backdrop-blur-md',
          className,
        )}
      >
        {core}
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div
        className={cn(
          'absolute inset-0 z-20 flex items-center justify-center bg-[rgba(5,8,12,0.72)] px-4 backdrop-blur-sm',
          className,
        )}
      >
        {core}
      </div>
    );
  }

  if (variant === 'inline') {
    return <div className={className}>{core}</div>;
  }

  return (
    <div
      className={cn(
        'flex min-h-[40vh] w-full items-center justify-center px-4 py-12 sm:min-h-[50vh] sm:py-16',
        className,
      )}
    >
      {core}
    </div>
  );
}
