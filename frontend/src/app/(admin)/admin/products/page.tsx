'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Loader2, Search, X } from 'lucide-react';
import { BrandLoader } from '@/components/ui/brand-loader';
import { apiDelete, apiGet, apiGetWithMeta, apiPatch, apiPost, ApiError } from '@/lib/api';
import { uploadProductImage } from '@/lib/cloudinary-upload';
import { fieldErrorsFromApi, firstApiErrorMessage } from '@/lib/field-errors';
import { brandFallbackImage } from '@/lib/product-image';
import { formatGbp } from '@/lib/utils';
import { notify } from '@/lib/toast';
import { PageHeader, Panel } from '@/features/admin/components/page-shell';
import {
  emptyImageSlots,
  penceToPoundsInput,
  poundsToPence,
  productFormSchema,
  type ProductFormValues,
  type ProductImageSlot,
} from '@/features/admin/schemas/product';

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  status: string;
  stock?: number;
  categoryId?: string | null;
  brandId?: string | null;
  shortDescription?: string | null;
  isFeatured?: boolean;
  isPreorder?: boolean;
  releaseDate?: string | null;
  tradeInCashPence?: number | null;
  tradeInCreditPence?: number | null;
  platform?: string | null;
  condition?: string | null;
  brand?: { id: string; name: string; slug: string } | null;
  images?: Array<{
    url: string;
    publicId?: string | null;
    isPrimary?: boolean;
    sortOrder?: number;
    altText?: string | null;
  }>;
};

type Category = { id: string; name: string };
type Brand = { id: string; name: string };

const MAX_IMAGES = 4;
const PAGE_SIZE = 20;

type ListMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

const defaults: ProductFormValues = {
  name: '',
  pricePounds: '',
  quantity: '0',
  status: 'ACTIVE',
  categoryId: '',
  brandId: '',
  shortDescription: '',
  images: emptyImageSlots(),
  isFeatured: false,
  isPreorder: false,
  releaseDate: '',
  tradeInCashPounds: '',
  tradeInCreditPounds: '',
  platform: '',
  condition: 'NEW',
};

function slotsFromProductImages(images?: Product['images']): ProductImageSlot[] {
  const slots = emptyImageSlots();
  if (!images?.length) return slots;

  const sorted = [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  sorted.slice(0, MAX_IMAGES).forEach((img, i) => {
    slots[i] = {
      url: img.url,
      publicId: img.publicId ?? '',
      isPrimary: Boolean(img.isPrimary) || i === 0,
      sortOrder: i,
    };
  });

  if (!slots.some((s) => s.isPrimary && s.url)) {
    const first = slots.findIndex((s) => s.url);
    if (first >= 0) slots[first].isPrimary = true;
  }

  return slots;
}

function productListThumb(p: Product): string {
  const primary = p.images?.find((i) => i.isPrimary) ?? p.images?.[0];
  if (primary?.url) return primary.url;
  return brandFallbackImage(p);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-[var(--admin-danger)]">{message}</p>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError: setFormError,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  });

  const images = watch('images') ?? emptyImageSlots();

  const load = useCallback(async (q: string, pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
        sort: 'name_asc',
      });
      if (q.trim()) params.set('q', q.trim());

      const [listResult, cats, brs] = await Promise.all([
        apiGetWithMeta<Product[], ListMeta>(`/admin/products?${params.toString()}`),
        apiGet<Category[]>('/admin/categories'),
        apiGet<Brand[]>('/admin/brands'),
      ]);

      const items = Array.isArray(listResult.data) ? listResult.data : [];
      const meta = listResult.meta ?? {};
      const nextTotal = typeof meta.total === 'number' ? meta.total : items.length;
      const nextTotalPages =
        typeof meta.totalPages === 'number'
          ? Math.max(1, meta.totalPages)
          : Math.max(1, Math.ceil(nextTotal / PAGE_SIZE) || 1);

      setProducts(items);
      setTotal(nextTotal);
      setTotalPages(nextTotalPages);
      if (pageNum > nextTotalPages) setPage(nextTotalPages);
      setCategories(cats);
      setBrands(brs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchQ(searchInput.trim());
      setPage(1);
    }, 320);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    void load(searchQ, page);
  }, [load, searchQ, page]);

  function openCreate() {
    setEditingId(null);
    reset(defaults);
    setError(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    reset({
      name: p.name,
      pricePounds: penceToPoundsInput(p.price),
      quantity: String(p.stock ?? 0),
      status: (p.status as ProductFormValues['status']) || 'ACTIVE',
      categoryId: p.categoryId ?? '',
      brandId: p.brandId ?? '',
      shortDescription: p.shortDescription ?? '',
      images: slotsFromProductImages(p.images),
      isFeatured: Boolean(p.isFeatured),
      isPreorder: Boolean(p.isPreorder),
      releaseDate: p.releaseDate ? String(p.releaseDate).slice(0, 10) : '',
      tradeInCashPounds: p.tradeInCashPence != null ? penceToPoundsInput(p.tradeInCashPence) : '',
      tradeInCreditPounds:
        p.tradeInCreditPence != null ? penceToPoundsInput(p.tradeInCreditPence) : '',
      platform: p.platform ?? '',
      condition: (p.condition as ProductFormValues['condition']) || 'NEW',
    });
    setError(null);
    setShowForm(true);
  }

  function updateSlots(next: ProductImageSlot[]) {
    setValue('images', next, { shouldValidate: true, shouldDirty: true });
  }

  async function onPickImage(slotIndex: number, file: File | undefined) {
    if (!file) return;
    setUploadingSlot(slotIndex);
    setError(null);
    try {
      const uploaded = await uploadProductImage(file);
      const next = images.map((slot, i) =>
        i === slotIndex
          ? {
              url: uploaded.url,
              publicId: uploaded.publicId,
              isPrimary: slot.isPrimary || !images.some((s) => s.url && s.isPrimary),
              sortOrder: i,
            }
          : slot,
      );
      if (!next.some((s) => s.isPrimary && s.url)) {
        next[slotIndex].isPrimary = true;
      }
      updateSlots(next);
    } catch (err) {
      setError(firstApiErrorMessage(err, 'Image upload failed'));
    } finally {
      setUploadingSlot(null);
    }
  }

  function removeSlot(slotIndex: number) {
    const next = images.map((slot, i) =>
      i === slotIndex ? { url: '', publicId: '', isPrimary: false, sortOrder: i } : slot,
    );
    if (!next.some((s) => s.isPrimary && s.url)) {
      const first = next.findIndex((s) => s.url);
      if (first >= 0) next[first].isPrimary = true;
    }
    updateSlots(next);
  }

  function setPrimary(slotIndex: number) {
    if (!images[slotIndex]?.url) return;
    updateSlots(
      images.map((slot, i) => ({
        ...slot,
        isPrimary: i === slotIndex,
        sortOrder: i,
      })),
    );
  }

  function onSubmit(values: ProductFormValues) {
    startTransition(async () => {
      try {
        setError(null);
        const filled = (values.images ?? [])
          .map((img, index) => ({ ...img, sortOrder: index }))
          .filter((img) => Boolean(img.url?.trim()));

        const primaryIndex = Math.max(
          0,
          filled.findIndex((img) => img.isPrimary),
        );
        const imagesPayload = filled.map((img, index) => ({
          url: img.url,
          publicId: img.publicId || undefined,
          isPrimary: index === primaryIndex,
          sortOrder: index,
        }));

        const body = {
          name: values.name.trim(),
          price: poundsToPence(values.pricePounds),
          quantity: Math.round(Number(values.quantity || '0')),
          status: values.status,
          categoryId: values.categoryId || null,
          brandId: values.brandId || null,
          shortDescription: values.shortDescription?.trim() || undefined,
          images: imagesPayload,
          isFeatured: Boolean(values.isFeatured),
          isPreorder: Boolean(values.isPreorder),
          releaseDate: values.releaseDate?.trim() || null,
          tradeInCashPence: values.tradeInCashPounds?.trim()
            ? poundsToPence(values.tradeInCashPounds)
            : null,
          tradeInCreditPence: values.tradeInCreditPounds?.trim()
            ? poundsToPence(values.tradeInCreditPounds)
            : null,
          platform: values.platform?.trim() || null,
          condition: values.condition,
        };

        if (editingId) {
          await apiPatch(`/admin/products/${editingId}`, body);
        } else {
          await apiPost('/admin/products', body);
        }
        setShowForm(false);
        notify.success(editingId ? 'Product updated' : 'Product created');
        await load(searchQ, page);
      } catch (err) {
        const fieldMap = fieldErrorsFromApi(err);
        for (const [key, message] of Object.entries(fieldMap)) {
          if (key === 'price') {
            setFormError('pricePounds', { type: 'server', message });
            continue;
          }
          if (
            key === 'name' ||
            key === 'quantity' ||
            key === 'status' ||
            key === 'categoryId' ||
            key === 'brandId' ||
            key === 'shortDescription' ||
            key === 'images'
          ) {
            setFormError(key as keyof ProductFormValues, { type: 'server', message });
          }
        }
        const message = firstApiErrorMessage(err, 'Save failed');
        setError(message);
        notify.error(message);
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Products"
        description="Create and edit catalog items. Only name and price are required."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-black"
          >
            New product
          </button>
        }
      />

      {error ? <p className="mb-4 text-sm text-[var(--admin-danger)]">{error}</p> : null}

      {showForm ? (
        <Panel className="mb-6 p-5">
          <p className="mb-4 text-sm font-medium">
            {editingId ? 'Edit product' : 'Create product'}
          </p>
          <form
            className="space-y-4"
            onSubmit={handleSubmit(onSubmit, (formErrors) => {
              const first =
                formErrors.name?.message ||
                formErrors.pricePounds?.message ||
                formErrors.tradeInCashPounds?.message ||
                formErrors.tradeInCreditPounds?.message ||
                formErrors.images?.message ||
                (Array.isArray(formErrors.images)
                  ? formErrors.images.find((slot) => slot?.url?.message)?.url?.message
                  : undefined) ||
                'Please fix the highlighted fields';
              setError(String(first));
              notify.error(String(first));
            })}
            noValidate
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs text-[var(--admin-muted)] sm:col-span-2">
                Name <span className="text-[var(--admin-danger)]">*</span>
                <input
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm text-[var(--admin-fg)]"
                  placeholder="e.g. Elden Ring (PS5)"
                  {...register('name')}
                />
                <FieldError message={errors.name?.message} />
              </label>

              <label className="block text-xs text-[var(--admin-muted)]">
                Price (£) <span className="text-[var(--admin-danger)]">*</span>
                <input
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm text-[var(--admin-fg)]"
                  placeholder="49.99"
                  inputMode="decimal"
                  {...register('pricePounds')}
                />
                <FieldError message={errors.pricePounds?.message} />
              </label>

              <label className="block text-xs text-[var(--admin-muted)]">
                Stock qty <span className="font-normal opacity-70">(optional)</span>
                <input
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm text-[var(--admin-fg)]"
                  {...register('quantity')}
                />
                <FieldError message={errors.quantity?.message} />
              </label>

              <label className="block text-xs text-[var(--admin-muted)]">
                Status
                <select
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                  {...register('status')}
                >
                  {['DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.status?.message} />
              </label>

              <label className="block text-xs text-[var(--admin-muted)]">
                Category <span className="font-normal opacity-70">(optional)</span>
                <select
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                  {...register('categoryId')}
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs text-[var(--admin-muted)]">
                Brand <span className="font-normal opacity-70">(optional)</span>
                <select
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                  {...register('brandId')}
                >
                  <option value="">None</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs text-[var(--admin-muted)] sm:col-span-2">
                Short description <span className="font-normal opacity-70">(optional)</span>
                <textarea
                  rows={2}
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm text-[var(--admin-fg)]"
                  {...register('shortDescription')}
                />
                <FieldError message={errors.shortDescription?.message} />
              </label>

              <label className="inline-flex items-center gap-2 text-xs text-[var(--admin-muted)] sm:col-span-2">
                <input type="checkbox" className="rounded" {...register('isFeatured')} />
                Feature on homepage hero
              </label>

              <label className="inline-flex items-center gap-2 text-xs text-[var(--admin-muted)]">
                <input type="checkbox" className="rounded" {...register('isPreorder')} />
                Pre-order / upcoming release
              </label>

              <label className="block text-xs text-[var(--admin-muted)]">
                Release date
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                  {...register('releaseDate')}
                />
              </label>

              <label className="block text-xs text-[var(--admin-muted)]">
                Platform
                <input
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                  placeholder="PS5, SWITCH, PC…"
                  {...register('platform')}
                />
              </label>

              <label className="block text-xs text-[var(--admin-muted)]">
                Condition
                <select
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                  {...register('condition')}
                >
                  <option value="NEW">New</option>
                  <option value="PRE_OWNED_EXCELLENT">Used — Excellent</option>
                  <option value="PRE_OWNED_GOOD">Used — Good</option>
                  <option value="PRE_OWNED_FAIR">Used — Fair</option>
                </select>
              </label>

              <label className="block text-xs text-[var(--admin-muted)]">
                Trade-in cash (£)
                <input
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                  placeholder="4.00"
                  {...register('tradeInCashPounds')}
                />
                <span className="mt-1 block text-[10px] opacity-70">
                  Shown on product cards as “We buy · cash”. Edit here anytime.
                </span>
              </label>

              <label className="block text-xs text-[var(--admin-muted)]">
                Trade-in store credit (£)
                <input
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                  placeholder="6.00"
                  {...register('tradeInCreditPounds')}
                />
                <span className="mt-1 block text-[10px] opacity-70">
                  Shown on product cards as “We buy · store credit”.
                </span>
              </label>
            </div>

            <div>
              <p className="mb-2 text-xs text-[var(--admin-muted)]">
                Product gallery{' '}
                <span className="font-normal opacity-70">(1 main + up to 3 extras)</span>
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {images.map((slot, index) => {
                  const uploading = uploadingSlot === index;
                  const label = index === 0 || slot.isPrimary ? 'Main' : `Extra ${index}`;
                  return (
                    <div
                      key={index}
                      className="rounded-md border border-[var(--admin-border)] bg-black/20 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-[var(--admin-muted)]">
                          {label}
                        </span>
                        {slot.isPrimary && slot.url ? (
                          <span className="text-[10px] font-medium text-[var(--admin-accent)]">
                            Primary
                          </span>
                        ) : null}
                      </div>

                      {slot.url ? (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={slot.url}
                            alt={`Product slot ${index + 1}`}
                            className="aspect-square w-full rounded-md border border-[var(--admin-border)] object-cover"
                          />
                          <button
                            type="button"
                            aria-label={`Remove image ${index + 1}`}
                            className="absolute -right-2 -top-2 rounded-full bg-[var(--admin-danger)] p-1 text-black"
                            onClick={() => removeSlot(index)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[var(--admin-border)] transition hover:border-[var(--admin-accent)]">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="sr-only"
                            disabled={uploadingSlot !== null}
                            onChange={(e) => void onPickImage(index, e.target.files?.[0])}
                          />
                          {uploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-[var(--admin-accent)]" />
                          ) : (
                            <ImagePlus className="h-6 w-6 text-[var(--admin-accent)]" />
                          )}
                          <span className="mt-2 text-[10px] text-[var(--admin-muted)]">
                            {uploading ? 'Uploading…' : 'Upload'}
                          </span>
                        </label>
                      )}

                      {slot.url ? (
                        <div className="mt-2 flex flex-col gap-1">
                          {!slot.isPrimary ? (
                            <button
                              type="button"
                              className="text-[11px] text-[var(--admin-accent)] hover:underline"
                              onClick={() => setPrimary(index)}
                            >
                              Set as main
                            </button>
                          ) : null}
                          <label className="cursor-pointer text-[11px] text-[var(--admin-muted)] hover:underline">
                            Replace
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="sr-only"
                              disabled={uploadingSlot !== null}
                              onChange={(e) => void onPickImage(index, e.target.files?.[0])}
                            />
                          </label>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <FieldError
                message={
                  typeof errors.images?.message === 'string' ? errors.images.message : undefined
                }
              />
              <p className="mt-2 text-[11px] text-[var(--admin-muted)]">
                JPG, PNG, WEBP or GIF · max 8MB each · Slug and SKU are generated from the name.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending || uploadingSlot !== null}
                className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
              >
                {pending ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--admin-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, SKU, or description…"
              className="w-full rounded-md border border-[var(--admin-border)] bg-black/20 py-2 pl-9 pr-3 text-sm text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)]"
            />
          </div>
          <p className="text-xs text-[var(--admin-muted)]">
            {loading
              ? 'Loading…'
              : total === 0
                ? searchQ
                  ? `No products matching “${searchQ}”`
                  : 'No products'
                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}${
                    searchQ ? ` matching “${searchQ}”` : ''
                  }`}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <BrandLoader
              variant="inline"
              size="sm"
              label="Loading products…"
              showWordmark={false}
            />
          </div>
        ) : products.length === 0 ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">
            {searchQ ? `No products match “${searchQ}”.` : 'No products found.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-muted)]">
                  <th className="w-16 px-4 py-3 font-medium">Image</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const thumb = productListThumb(p);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-[var(--admin-border)]/70 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-2">
                        <div className="h-12 w-12 overflow-hidden rounded-md border border-[var(--admin-border)] bg-black/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumb}
                            alt=""
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--admin-muted)]">
                        {p.sku}
                      </td>
                      <td className="px-4 py-3 font-mono">{formatGbp(p.price)}</td>
                      <td className="px-4 py-3 font-mono">{p.stock ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--admin-muted)]">{p.status}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            className="text-sm text-[var(--admin-accent)] hover:underline"
                            onClick={() => openEdit(p)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-sm text-[var(--admin-danger)] hover:underline"
                            disabled={pending}
                            onClick={() => {
                              if (!window.confirm(`Delete product “${p.name}”?`)) return;
                              startTransition(async () => {
                                try {
                                  await apiDelete(`/admin/products/${p.id}`);
                                  if (editingId === p.id) {
                                    setShowForm(false);
                                    setEditingId(null);
                                  }
                                  await load(searchQ, page);
                                } catch (err) {
                                  setError(err instanceof ApiError ? err.message : 'Delete failed');
                                }
                              });
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > 0 ? (
          <div className="flex flex-col gap-3 border-t border-[var(--admin-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--admin-muted)]">
              Page {page} of {totalPages}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-[var(--admin-border)] px-3 py-1.5 text-xs font-medium disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<Array<number | 'ellipsis'>>((acc, n, idx, arr) => {
                  if (idx > 0) {
                    const prev = arr[idx - 1]!;
                    if (n - prev > 1) acc.push('ellipsis');
                  }
                  acc.push(n);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-1 text-xs text-[var(--admin-muted)]">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      disabled={loading || item === page}
                      onClick={() => setPage(item)}
                      className={`min-w-8 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                        item === page
                          ? 'bg-[var(--admin-accent)] text-black'
                          : 'border border-[var(--admin-border)] disabled:opacity-40'
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-[var(--admin-border)] px-3 py-1.5 text-xs font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </Panel>
    </>
  );
}
