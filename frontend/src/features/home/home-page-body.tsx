'use client';

import { FeaturedCategories } from './components/featured-categories';
import { Newsletter } from './components/newsletter';
import { ProductGridSection } from './components/product-grid-section';
import { PromoBanner } from './components/promo-banner';
import { TradeInCta } from './components/trade-in-cta';

/** Home product sections — PlayStation-led arrivals + full-catalog best sellers. */
export function HomePageBody() {
  return (
    <>
      <PromoBanner />
      <FeaturedCategories />

      {/* Fresh stock: PlayStation consoles + DualSense + latest PS games (like console cards) */}
      <ProductGridSection
        eyebrow="Fresh stock"
        title="New arrivals"
        description="The latest drops, ready to ship across the UK — PS5 & PlayStation hardware first."
        queryKey={['products', 'newest-home-playstation']}
        endpoints={[
          '/products?category=playstation-consoles&sort=newest&limit=12',
          '/products?category=playstation-accessories&sort=newest&limit=12',
          '/products?category=playstation-5-games&sort=newest&limit=12',
          '/products?category=playstation-4-games&sort=newest&limit=8',
        ]}
        maxItems={16}
        viewAllHref="/shop?category=game-consoles"
      />

      <TradeInCta />

      {/* Popular: mix of every platform — games, consoles, accessories */}
      <ProductGridSection
        eyebrow="Popular"
        title="Best sellers"
        description="What UK gamers are picking up right now — PS, Xbox, Switch, accessories and more."
        queryKey={['products', 'bestsellers-home-mix']}
        endpoints={[
          '/products?sort=featured&limit=16',
          '/products?category=playstation-5-games&sort=featured&limit=10',
          '/products?category=playstation-4-games&limit=8',
          '/products?category=playstation-3-games&limit=6',
          '/products?category=playstation-2-games&limit=6',
          '/products?category=xbox-games&limit=8',
          '/products?category=nintendo-switch-games&limit=8',
          '/products?category=nintendo-switch-2-games&limit=6',
          '/products?category=xbox-consoles&limit=6',
          '/products?category=nintendo-consoles&limit=6',
          '/products?category=playstation-accessories&limit=8',
          '/products?category=nintendo-accessories&limit=6',
          '/products?sort=newest&limit=12',
        ]}
        maxItems={20}
        viewAllHref="/shop?sort=featured"
      />

      <Newsletter />
    </>
  );
}
