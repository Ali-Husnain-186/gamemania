export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  children?: Category[];
};

export type ProductImage = {
  id?: string;
  url: string;
  publicId?: string | null;
  altText?: string | null;
  alt?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  sku?: string;
  description?: string | null;
  shortDescription?: string | null;
  /** Price in pence */
  price: number;
  compareAtPrice?: number | null;
  condition?: string | null;
  platform?: string | null;
  brand?: { id: string; name: string; slug: string } | null;
  category?: { id: string; name: string; slug: string } | null;
  images?: ProductImage[];
  stock?: number;
  inStock?: boolean;
  status?: string;
  isFeatured?: boolean;
  isPreorder?: boolean;
  releaseDate?: string | null;
  tradeInCashPence?: number | null;
  tradeInCreditPence?: number | null;
};

export type ProductSort =
  'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'featured';

export type ProductsQuery = {
  q?: string;
  category?: string;
  sort?: ProductSort | string;
  page?: number;
  limit?: number;
};

export type ProductsResult = {
  items: Product[];
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages?: number;
    };
  };
};
