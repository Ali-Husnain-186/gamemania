'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { BrandLoader } from '@/components/ui/brand-loader';

function isInternalNav(anchor: HTMLAnchorElement): boolean {
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
    try {
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return false;
    } catch {
      return false;
    }
  }
  return true;
}

function sameDestination(href: string): boolean {
  try {
    const next = new URL(href, window.location.origin);
    return (
      next.pathname === window.location.pathname &&
      next.search === window.location.search &&
      next.hash === window.location.hash
    );
  } catch {
    return false;
  }
}

/**
 * Shows the brand loader during client-side route changes (link clicks + URL updates).
 */
function NavigationLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const prevRoute = useRef(routeKey);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalNav(anchor)) return;

      const href = anchor.getAttribute('href');
      if (!href || sameDestination(href)) return;

      if (hideTimer.current) clearTimeout(hideTimer.current);
      setActive(true);
    };

    document.addEventListener('click', onPointerDown, true);
    return () => document.removeEventListener('click', onPointerDown, true);
  }, []);

  useEffect(() => {
    if (prevRoute.current === routeKey) return;
    prevRoute.current = routeKey;
    if (!active) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setActive(false), 320);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [routeKey, active]);

  // Safety: never leave the overlay stuck
  useEffect(() => {
    if (!active) return;
    const failSafe = setTimeout(() => setActive(false), 8000);
    return () => clearTimeout(failSafe);
  }, [active]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[110]">
      {/* Thin progress rail */}
      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-black/40">
        <div className="gm-nav-progress h-full w-full origin-left bg-gradient-to-r from-[var(--gm-cyan)] via-[var(--gm-yellow)] to-[var(--gm-magenta)]" />
      </div>
      <div className="pointer-events-auto flex h-full items-center justify-center bg-[rgba(5,8,12,0.55)] px-4 backdrop-blur-[6px]">
        <BrandLoader variant="inline" size="md" label="Loading page…" showWordmark />
      </div>
    </div>
  );
}

export function NavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderInner />
    </Suspense>
  );
}
