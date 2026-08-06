'use client';

import { useEffect, useState, useTransition } from 'react';
import { apiGet, apiPatch, ApiError } from '@/lib/api';
import { PageHeader, Panel } from '@/features/admin/components/page-shell';
import {
  DEFAULT_HOME_HERO,
  normalizeHomeHero,
  type HomeHeroContent,
  type HeroSlide,
} from '@/features/home/home-hero-content';

const KEYS = [
  { key: 'store.name', label: 'Store name' },
  { key: 'shipping.free_threshold_pence', label: 'Free shipping threshold (pence)' },
  { key: 'loyalty.points_per_pound', label: 'Loyalty points per £1' },
] as const;

type SocialLink = {
  id: string;
  label: string;
  url: string;
  icon: string;
  enabled: boolean;
};

const ICON_OPTIONS = ['instagram', 'facebook', 'twitter', 'youtube', 'tiktok', 'custom'];

function newSocialId() {
  return `social-${Date.now().toString(36)}`;
}

function emptySlide(): HeroSlide {
  return { label: '', href: '/', cta: '' };
}

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [hero, setHero] = useState<HomeHeroContent>(DEFAULT_HOME_HERO);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    void (async () => {
      try {
        const entries = await Promise.all(
          KEYS.map(async ({ key }) => {
            try {
              const row = await apiGet<{ key: string; value: unknown }>(`/admin/settings/${key}`);
              return [key, String(row.value ?? '')] as const;
            } catch {
              return [key, ''] as const;
            }
          }),
        );
        setValues(Object.fromEntries(entries));

        try {
          const social = await apiGet<{ key: string; value: unknown }>(
            '/admin/settings/social.links',
          );
          if (Array.isArray(social.value)) {
            setSocialLinks(social.value as SocialLink[]);
          }
        } catch {
          setSocialLinks([]);
        }

        try {
          const heroRow = await apiGet<{ key: string; value: unknown }>(
            '/admin/settings/home.hero',
          );
          setHero(normalizeHomeHero(heroRow.value));
        } catch {
          setHero(DEFAULT_HOME_HERO);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load settings');
      }
    })();
  }, []);

  function save(key: string) {
    startTransition(async () => {
      try {
        setMessage(null);
        setError(null);
        const raw = values[key] ?? '';
        const value = /^\d+$/.test(raw) ? Number(raw) : raw;
        await apiPatch(`/admin/settings/${key}`, { value });
        setMessage(`Saved ${key}`);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Save failed');
      }
    });
  }

  function saveSocial() {
    startTransition(async () => {
      try {
        setMessage(null);
        setError(null);
        await apiPatch('/admin/settings/social.links', {
          value: socialLinks,
          group: 'social',
        });
        setMessage('Saved social links');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Save social links failed');
      }
    });
  }

  function saveHero() {
    startTransition(async () => {
      try {
        setMessage(null);
        setError(null);
        const payload = normalizeHomeHero(hero);
        await apiPatch('/admin/settings/home.hero', {
          value: payload,
          group: 'home',
        });
        setHero(payload);
        setMessage('Saved homepage hero');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Save hero failed');
      }
    });
  }

  function setHeroField<K extends keyof HomeHeroContent>(key: K, value: HomeHeroContent[K]) {
    setHero((h) => ({ ...h, [key]: value }));
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Store configuration, homepage hero copy, and social media links."
      />
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
      {message ? <p className="mb-4 text-sm text-emerald-300">{message}</p> : null}
      <div className="space-y-4">
        {KEYS.map(({ key, label }) => (
          <Panel key={key} className="flex flex-wrap items-end gap-3 p-5">
            <label className="min-w-[240px] flex-1 text-xs text-[var(--admin-muted)]">
              {label}
              <span className="mt-0.5 block font-mono text-[10px] opacity-70">{key}</span>
              <input
                className="mt-2 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                value={values[key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              />
            </label>
            <button
              type="button"
              disabled={pending}
              onClick={() => save(key)}
              className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              Save
            </button>
          </Panel>
        ))}

        <Panel className="space-y-4 p-5">
          <div>
            <p className="text-sm font-semibold">Homepage hero</p>
            <p className="text-xs text-[var(--admin-muted)]">
              Controls the big banner on the homepage (title, subtitle, background image, CTA
              buttons). Changes show on the live storefront after save.
            </p>
            <span className="mt-1 block font-mono text-[10px] text-[var(--admin-muted)] opacity-70">
              home.hero
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs text-[var(--admin-muted)]">
              Eyebrow (above title)
              <input
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm text-white"
                value={hero.eyebrow}
                onChange={(e) => setHeroField('eyebrow', e.target.value)}
              />
            </label>
            <label className="text-xs text-[var(--admin-muted)]">
              Background image URL
              <input
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm text-white"
                placeholder="/brand/hero-main.jpg"
                value={hero.backgroundImageUrl}
                onChange={(e) => setHeroField('backgroundImageUrl', e.target.value)}
              />
            </label>
            <label className="text-xs text-[var(--admin-muted)]">
              Title line 1
              <input
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm text-white"
                value={hero.titleLine1}
                onChange={(e) => setHeroField('titleLine1', e.target.value)}
              />
            </label>
            <label className="text-xs text-[var(--admin-muted)]">
              Title line 2 (yellow)
              <input
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm text-white"
                value={hero.titleLine2}
                onChange={(e) => setHeroField('titleLine2', e.target.value)}
              />
            </label>
            <label className="text-xs text-[var(--admin-muted)] md:col-span-2">
              Subtitle (full sentence)
              <textarea
                rows={3}
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm text-white"
                value={hero.subtitle}
                onChange={(e) => setHeroField('subtitle', e.target.value)}
              />
            </label>
            <label className="text-xs text-[var(--admin-muted)] md:col-span-2">
              Subtitle highlight (exact phrase inside subtitle → yellow)
              <input
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm text-white"
                value={hero.subtitleHighlight}
                onChange={(e) => setHeroField('subtitleHighlight', e.target.value)}
              />
            </label>
            <label className="text-xs text-[var(--admin-muted)]">
              Tagline (mobile)
              <input
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm text-white"
                value={hero.taglineMobile}
                onChange={(e) => setHeroField('taglineMobile', e.target.value)}
              />
            </label>
            <label className="text-xs text-[var(--admin-muted)]">
              Tagline (desktop)
              <input
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm text-white"
                value={hero.taglineDesktop}
                onChange={(e) => setHeroField('taglineDesktop', e.target.value)}
              />
            </label>
            <label className="text-xs text-[var(--admin-muted)] md:col-span-2">
              Background image alt text
              <input
                className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm text-white"
                value={hero.backgroundAlt}
                onChange={(e) => setHeroField('backgroundAlt', e.target.value)}
              />
            </label>
          </div>

          <div className="space-y-3 border-t border-[var(--admin-border)] pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">Rotating CTA buttons</p>
              <button
                type="button"
                className="rounded-md border border-[var(--admin-border)] px-3 py-1.5 text-xs font-semibold"
                onClick={() => setHeroField('slides', [...hero.slides, emptySlide()])}
              >
                Add CTA
              </button>
            </div>
            {hero.slides.map((slide, index) => (
              <div
                key={`slide-${index}`}
                className="grid gap-2 rounded-md border border-[var(--admin-border)] p-3 md:grid-cols-4"
              >
                <input
                  className="rounded-md border border-[var(--admin-border)] bg-black/20 px-2 py-1.5 text-sm"
                  placeholder="Label"
                  value={slide.label}
                  onChange={(e) =>
                    setHeroField(
                      'slides',
                      hero.slides.map((s, i) =>
                        i === index ? { ...s, label: e.target.value } : s,
                      ),
                    )
                  }
                />
                <input
                  className="rounded-md border border-[var(--admin-border)] bg-black/20 px-2 py-1.5 text-sm"
                  placeholder="Button text (CTA)"
                  value={slide.cta}
                  onChange={(e) =>
                    setHeroField(
                      'slides',
                      hero.slides.map((s, i) => (i === index ? { ...s, cta: e.target.value } : s)),
                    )
                  }
                />
                <input
                  className="rounded-md border border-[var(--admin-border)] bg-black/20 px-2 py-1.5 text-sm md:col-span-1"
                  placeholder="/shop?..."
                  value={slide.href}
                  onChange={(e) =>
                    setHeroField(
                      'slides',
                      hero.slides.map((s, i) => (i === index ? { ...s, href: e.target.value } : s)),
                    )
                  }
                />
                <button
                  type="button"
                  className="text-left text-xs text-red-300 md:text-center"
                  onClick={() =>
                    setHeroField(
                      'slides',
                      hero.slides.filter((_, i) => i !== index),
                    )
                  }
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={saveHero}
              className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              Save homepage hero
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setHero(DEFAULT_HOME_HERO)}
              className="rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm"
            >
              Reset form to defaults
            </button>
          </div>
        </Panel>

        <Panel className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Social media links</p>
              <p className="text-xs text-[var(--admin-muted)]">
                Add, edit or remove icons shown in the storefront footer.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md border border-[var(--admin-border)] px-3 py-2 text-xs font-semibold"
              onClick={() =>
                setSocialLinks((rows) => [
                  ...rows,
                  {
                    id: newSocialId(),
                    label: 'Instagram',
                    url: 'https://',
                    icon: 'instagram',
                    enabled: true,
                  },
                ])
              }
            >
              Add link
            </button>
          </div>

          {socialLinks.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">No social links yet.</p>
          ) : (
            <div className="space-y-3">
              {socialLinks.map((link, index) => (
                <div
                  key={link.id}
                  className="grid gap-2 rounded-md border border-[var(--admin-border)] p-3 md:grid-cols-5"
                >
                  <input
                    className="rounded-md border border-[var(--admin-border)] bg-black/20 px-2 py-1.5 text-sm"
                    placeholder="Label"
                    value={link.label}
                    onChange={(e) =>
                      setSocialLinks((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, label: e.target.value } : r)),
                      )
                    }
                  />
                  <input
                    className="rounded-md border border-[var(--admin-border)] bg-black/20 px-2 py-1.5 text-sm md:col-span-2"
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) =>
                      setSocialLinks((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, url: e.target.value } : r)),
                      )
                    }
                  />
                  <select
                    className="rounded-md border border-[var(--admin-border)] bg-black/20 px-2 py-1.5 text-sm"
                    value={link.icon}
                    onChange={(e) =>
                      setSocialLinks((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, icon: e.target.value } : r)),
                      )
                    }
                  >
                    {ICON_OPTIONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={link.enabled}
                        onChange={(e) =>
                          setSocialLinks((rows) =>
                            rows.map((r, i) =>
                              i === index ? { ...r, enabled: e.target.checked } : r,
                            ),
                          )
                        }
                      />
                      Enabled
                    </label>
                    <button
                      type="button"
                      className="ml-auto text-xs text-red-300"
                      onClick={() => setSocialLinks((rows) => rows.filter((_, i) => i !== index))}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={pending}
            onClick={saveSocial}
            className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            Save social links
          </button>
        </Panel>
      </div>
    </>
  );
}
