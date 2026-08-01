import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/json-ld';
import { apiGet, ApiError } from '@/lib/api';
import { breadcrumbJsonLd, buildPageMetadata, productJsonLd, truncateMeta } from '@/lib/seo';
import type { Product } from '@/types/catalog';
import { ProductDetailClient } from './product-detail-client';

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function loadProduct(slug: string): Promise<Product | null | undefined> {
  try {
    return await apiGet<Product>(`/products/${slug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    return undefined;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);

  if (product === null) {
    return buildPageMetadata({
      title: 'Product not found',
      description: 'This product is unavailable.',
      path: `/products/${slug}`,
      noIndex: true,
    });
  }

  if (!product) {
    return buildPageMetadata({
      title: 'Product',
      description: 'Browse genuine games, consoles and accessories at GameMania UK.',
      path: `/products/${slug}`,
    });
  }

  const title = product.metaTitle?.trim() || product.name;
  const description =
    product.metaDescription?.trim() ||
    product.shortDescription?.trim() ||
    (product.description ? truncateMeta(product.description) : undefined) ||
    `Buy ${product.name} at GameMania UK. Genuine games, consoles and accessories with free UK shipping on orders £60+.`;

  const image = product.images?.find((i) => i.isPrimary)?.url ?? product.images?.[0]?.url ?? null;

  return buildPageMetadata({
    title,
    description,
    path: `/products/${product.slug}`,
    image,
  });
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await loadProduct(slug);

  if (product === null) {
    notFound();
  }

  return (
    <>
      {product ? (
        <>
          <JsonLd data={productJsonLd(product)} />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Shop', path: '/shop' },
              ...(product.category
                ? [
                    {
                      name: product.category.name,
                      path: `/shop?category=${product.category.slug}`,
                    },
                  ]
                : []),
              { name: product.name, path: `/products/${product.slug}` },
            ])}
          />
        </>
      ) : null}
      <ProductDetailClient />
    </>
  );
}
