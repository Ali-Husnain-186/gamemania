'use client';

import { useEffect, useState, useTransition } from 'react';
import { apiGet, apiPatch, ApiError } from '@/lib/api';
import { PageHeader, Panel } from '@/features/admin/components/page-shell';

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

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
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

  return (
    <>
      <PageHeader
        title="Settings"
        description="Store configuration and social media links for the footer."
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
