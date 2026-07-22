/** Format integer pence as GBP display string */
export function formatGbp(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100);
}

export function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100);
}
