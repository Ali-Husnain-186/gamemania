import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatGbpFromPence } from '@/lib/money';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Alias used by admin pages (pence → GBP display). */
export function formatGbp(pence: number): string {
  return formatGbpFromPence(pence);
}
