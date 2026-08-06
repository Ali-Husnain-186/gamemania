'use client';

import { FeaturedCategories } from './components/featured-categories';
import { Newsletter } from './components/newsletter';
import { ProductGridSection } from './components/product-grid-section';
import { PromoBanner } from './components/promo-banner';
import { TradeInCta } from './components/trade-in-cta';
import { WhyChoose } from './components/why-choose';

/**
 * Client homepage stack:
 * Hero (in home-page-client) → Coupon → Trade-in → Featured → New → Best → Why Choose → Newsletter → Footer
 */
export function HomePageBody() {
  return (
    <>
      <PromoBanner />
      <TradeInCta />
      <FeaturedCategories />

      <ProductGridSection
        eyebrow="Fresh stock"
        title="New releases"
        description="Latest PS5 & PlayStation drops — ready to ship across the UK."
        queryKey={['products', 'newest-home-playstation']}
        endpoints={[
          '/products?category=playstation-consoles&sort=newest&limit=10',
          '/products?category=playstation-accessories&sort=newest&limit=10',
          '/products?category=playstation-5-games&sort=newest&limit=10',
          '/products?category=playstation-4-games&sort=newest&limit=6',
        ]}
        maxItems={12}
        viewAllHref="/shop?sort=newest"
      />

      <ProductGridSection
        eyebrow="Popular"
        title="Best sellers"
        description="What UK gamers are buying — games, consoles and accessories."
        queryKey={['products', 'bestsellers-home-mix']}
        endpoints={[
          '/products?sort=featured&limit=12',
          '/products?category=playstation-5-games&sort=featured&limit=8',
          '/products?category=xbox-games&limit=6',
          '/products?category=nintendo-switch-games&limit=6',
          '/products?sort=newest&limit=8',
        ]}
        maxItems={12}
        viewAllHref="/shop?sort=featured"
      />

      <WhyChoose />
      <Newsletter />
    </>
  );
}
