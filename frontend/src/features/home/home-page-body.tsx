'use client';

import { AccessoriesGrid } from './components/accessories-grid';
import { FeaturedCategories } from './components/featured-categories';
import { LatestBlogs } from './components/latest-blogs';
import { Newsletter } from './components/newsletter';
import { ProductGridSection } from './components/product-grid-section';
import { PromoBanner } from './components/promo-banner';
import { RetroShowcase } from './components/retro-showcase';
import { ReviewsSlider } from './components/reviews-slider';
import { ShopByPlatform } from './components/shop-by-platform';
import { TradeInCta } from './components/trade-in-cta';
import { WhyChoose } from './components/why-choose';

/** Everything below the hero — do not include navbar/hero here. */
export function HomePageBody() {
  return (
    <>
      <FeaturedCategories />
      <PromoBanner />
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
      <ShopByPlatform />
      <RetroShowcase />
      <AccessoriesGrid />
      <WhyChoose />
      <ReviewsSlider />
      <LatestBlogs />
      <Newsletter />
    </>
  );
}
