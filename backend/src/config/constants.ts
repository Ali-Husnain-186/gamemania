export const API_PREFIX = '/api/v1';

export const COOKIE_NAMES = {
  refreshToken: 'gm_refresh',
} as const;

/** Default shipping — overridden by ShippingRule rows in DB */
export const DEFAULT_SHIPPING = {
  freeThresholdPence: 6000,
  flatRatePence: 299,
  country: 'GB',
} as const;

/** Fixed postage when the cart contains only trade-in lines (customer sends kit to us). */
export const TRADE_IN_ONLY_SHIPPING_PENCE = 100;
