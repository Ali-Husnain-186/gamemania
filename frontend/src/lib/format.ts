export function formatGBP(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100);
}

/** Friendly shop labels for stored platform codes */
export function formatPlatform(platform?: string | null): string {
  if (!platform?.trim()) return 'Game';
  const key = platform.trim().toUpperCase().replace(/\s+/g, '_');
  const map: Record<string, string> = {
    PS5: 'PS5',
    PS4: 'PS4',
    PS3: 'PS3',
    PS2: 'PS2',
    XBOX_SERIES: 'Xbox Series',
    XBOX: 'Xbox',
    SWITCH: 'Switch',
    SWITCH2: 'Switch 2',
    PC: 'PC',
  };
  return map[key] ?? platform.replaceAll('_', ' ');
}

export function formatDate(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', options).format(date);
}
