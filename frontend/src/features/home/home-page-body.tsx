'use client';

import { FeaturedCategories } from './components/featured-categories';
import { Newsletter } from './components/newsletter';
import { ProductGridSection } from './components/product-grid-section';
import { PromoBanner } from './components/promo-banner';
import { TradeInCta } from './components/trade-in-cta';

/** Everything below the hero — keep homepage as a concise overview. */
export function HomePageBody() {
  return (
    <>
      <PromoBanner />
      <FeaturedCategories />
      <ProductGridSection
        eyebrow="Fresh stock"
        title="New arrivals"
        description="The latest drops, ready to ship across the UK."
        queryKey={['products', 'newest-home']}
        endpoint="/products?sort=newest&limit=8"
        viewAllHref="/shop?sort=newest"
      />
      <TradeInCta />
      <ProductGridSection
        eyebrow="Popular"
        title="Best sellers"
        description="What UK gamers are picking up right now."
        queryKey={['products', 'featured-home']}
        endpoint="/products?sort=featured&limit=8"
        viewAllHref="/shop?sort=featured"
      />
      <Newsletter />
    </>
  );
}
