'use client';

import { HomeHero } from '@/features/home/home-hero';
import { HomePageBody } from '@/features/home/home-page-body';

export default function HomePage() {
  return (
    <main className="relative overflow-x-hidden">
      <HomeHero />
      <HomePageBody />
    </main>
  );
}
