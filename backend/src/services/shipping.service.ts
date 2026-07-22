import { prisma } from '../config/prisma';
import { DEFAULT_SHIPPING } from '../config/constants';

export type ShippingQuote = {
  ratePence: number;
  freeShipping: boolean;
  ruleId: string | null;
  ruleName: string;
  thresholdPence: number;
  subtotalPence: number;
  country: string;
};

/**
 * Resolves shipping from active ShippingRule rows.
 * Fallback: flat rate under threshold, free at/above threshold.
 */
export async function quoteShipping(
  subtotalPence: number,
  country = DEFAULT_SHIPPING.country,
): Promise<ShippingQuote> {
  try {
    const rules = await prisma.shippingRule.findMany({
      where: {
        isActive: true,
        country,
        minOrderAmount: { lte: subtotalPence },
        OR: [{ maxOrderAmount: null }, { maxOrderAmount: { gte: subtotalPence } }],
      },
      orderBy: [{ priority: 'desc' }, { rate: 'asc' }],
    });

    if (rules.length > 0) {
      const rule = rules[0];
      return {
        ratePence: rule.rate,
        freeShipping: rule.rate === 0,
        ruleId: rule.id,
        ruleName: rule.name,
        thresholdPence: DEFAULT_SHIPPING.freeThresholdPence,
        subtotalPence,
        country,
      };
    }
  } catch {
    // DB unavailable during early local bootstrap — use configured defaults
  }

  const free = subtotalPence >= DEFAULT_SHIPPING.freeThresholdPence;
  return {
    ratePence: free ? 0 : DEFAULT_SHIPPING.flatRatePence,
    freeShipping: free,
    ruleId: null,
    ruleName: free ? 'Fallback free shipping' : 'Fallback flat rate',
    thresholdPence: DEFAULT_SHIPPING.freeThresholdPence,
    subtotalPence,
    country,
  };
}
