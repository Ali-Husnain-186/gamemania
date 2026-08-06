/** Homepage hero content (admin Setting key: home.hero). */

export type HeroSlide = {
  label: string;
  href: string;
  cta: string;
};

export type HomeHeroContent = {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  /** Full subtitle; `subtitleHighlight` is wrapped in yellow if found inside. */
  subtitle: string;
  subtitleHighlight: string;
  taglineMobile: string;
  taglineDesktop: string;
  backgroundImageUrl: string;
  backgroundAlt: string;
  /** Optional Cloudinary public id when uploaded from admin */
  backgroundPublicId?: string;
  slides: HeroSlide[];
};

export const DEFAULT_HOME_HERO: HomeHeroContent = {
  eyebrow: 'Built by Gamers, For Gamers',
  titleLine1: 'Trade. Play.',
  titleLine2: 'Repeat.',
  subtitle:
    "UK's trade-in gaming store — sell your kit for cash or store credit, then shop new & pre-owned games the same day.",
  subtitleHighlight: 'sell your kit for cash or store credit',
  taglineMobile: 'Games • Consoles • Trade In',
  taglineDesktop: 'Games • Consoles • Accessories • Trade In',
  backgroundImageUrl: '/brand/hero-main.jpg',
  backgroundAlt: 'GameMania UK gaming setup',
  slides: [
    { label: 'Video Games', href: '/shop?category=video-games', cta: 'Shop Video Games' },
    { label: 'Consoles', href: '/shop?category=game-consoles', cta: 'Shop Consoles' },
    { label: 'Accessories', href: '/shop?category=accessories', cta: 'Shop accessories' },
    { label: 'Trade-ins', href: '/trade-in', cta: 'Get a trade-in quote' },
  ],
};

export function normalizeHomeHero(raw: unknown): HomeHeroContent {
  if (!raw || typeof raw !== 'object')
    return { ...DEFAULT_HOME_HERO, slides: [...DEFAULT_HOME_HERO.slides] };
  const o = raw as Record<string, unknown>;
  const slidesRaw = Array.isArray(o.slides) ? o.slides : DEFAULT_HOME_HERO.slides;
  const slides: HeroSlide[] = slidesRaw
    .map((s) => {
      if (!s || typeof s !== 'object') return null;
      const row = s as Record<string, unknown>;
      const label = String(row.label ?? '').trim();
      const href = String(row.href ?? '').trim();
      const cta = String(row.cta ?? '').trim();
      if (!label || !href || !cta) return null;
      return { label, href, cta };
    })
    .filter((s): s is HeroSlide => Boolean(s));

  return {
    eyebrow: String(o.eyebrow ?? DEFAULT_HOME_HERO.eyebrow),
    titleLine1: String(o.titleLine1 ?? DEFAULT_HOME_HERO.titleLine1),
    titleLine2: String(o.titleLine2 ?? DEFAULT_HOME_HERO.titleLine2),
    subtitle: String(o.subtitle ?? DEFAULT_HOME_HERO.subtitle),
    subtitleHighlight: String(o.subtitleHighlight ?? DEFAULT_HOME_HERO.subtitleHighlight),
    taglineMobile: String(o.taglineMobile ?? DEFAULT_HOME_HERO.taglineMobile),
    taglineDesktop: String(o.taglineDesktop ?? DEFAULT_HOME_HERO.taglineDesktop),
    backgroundImageUrl: String(o.backgroundImageUrl ?? DEFAULT_HOME_HERO.backgroundImageUrl),
    backgroundAlt: String(o.backgroundAlt ?? DEFAULT_HOME_HERO.backgroundAlt),
    backgroundPublicId:
      typeof o.backgroundPublicId === 'string' && o.backgroundPublicId.trim()
        ? o.backgroundPublicId.trim()
        : undefined,
    slides: slides.length ? slides : [...DEFAULT_HOME_HERO.slides],
  };
}

export function renderSubtitle(subtitle: string, highlight: string) {
  if (!highlight.trim()) return { before: subtitle, highlight: '', after: '' };
  const idx = subtitle.indexOf(highlight);
  if (idx < 0) return { before: subtitle, highlight: '', after: '' };
  return {
    before: subtitle.slice(0, idx),
    highlight,
    after: subtitle.slice(idx + highlight.length),
  };
}
