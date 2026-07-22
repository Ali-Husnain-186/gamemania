export const API_PREFIX = '/api/v1';

export const COOKIE_NAMES = {
  refreshToken: 'gm_refresh',
} as const;

/** Default shipping — overridden by ShippingRule rows in DB */
export const DEFAULT_SHIPPING = {
  freeThresholdPence: 6000,
  flatRatePence: 395,
  country: 'GB',
} as const;
