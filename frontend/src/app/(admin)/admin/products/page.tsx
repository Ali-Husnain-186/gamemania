'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { apiGet, apiPatch, apiPost, ApiError } from '@/lib/api';
import { uploadProductImage } from '@/lib/cloudinary-upload';
import { fieldErrorsFromApi, firstApiErrorMessage } from '@/lib/field-errors';
import { formatGbp } from '@/lib/utils';
import { PageHeader, Panel } from '@/features/admin/components/page-shell';
import {
  penceToPoundsInput,
  poundsToPence,
  productFormSchema,
  type ProductFormValues,
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
  images?: Array<{ url: string; publicId?: string | null; isPrimary?: boolean }>;
};

type Category = { id: string; name: string };
type Brand = { id: string; name: string };

const defaults: ProductFormValues = {
  name: '',
  pricePounds: '',
  quantity: '0',
  status: 'ACTIVE',
  categoryId: '',
  brandId: '',
  shortDescription: '',
  imageUrl: '',
  imagePublicId: '',
  isFeatured: false,
};

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
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

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

  const imageUrl = watch('imageUrl');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [list, cats, brs] = await Promise.all([
        apiGet<Product[]>('/admin/products?limit=100'),
        apiGet<Category[]>('/categories'),
        apiGet<Brand[]>('/brands'),
      ]);
      setProducts(Array.isArray(list) ? list : []);
      setCategories(cats);
      setBrands(brs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setEditingId(null);
    reset(defaults);
    setError(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    const primary = p.images?.find((i) => i.isPrimary) ?? p.images?.[0];
    setEditingId(p.id);
    reset({
      name: p.name,
      pricePounds: penceToPoundsInput(p.price),
      quantity: String(p.stock ?? 0),
      status: (p.status as ProductFormValues['status']) || 'ACTIVE',
      categoryId: p.categoryId ?? '',
      brandId: p.brandId ?? '',
      shortDescription: p.shortDescription ?? '',
      imageUrl: primary?.url ?? '',
      imagePublicId: primary?.publicId ?? '',
      isFeatured: Boolean(p.isFeatured),
    });
    setError(null);
    setShowForm(true);
  }

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadProductImage(file);
      setValue('imageUrl', uploaded.url, { shouldValidate: true });
      setValue('imagePublicId', uploaded.publicId, { shouldValidate: true });
    } catch (err) {
      setError(firstApiErrorMessage(err, 'Image upload failed'));
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(values: ProductFormValues) {
    startTransition(async () => {
      try {
        setError(null);
        const body = {
          name: values.name.trim(),
          price: poundsToPence(values.pricePounds),
          quantity: Math.round(Number(values.quantity || '0')),
          status: values.status,
          categoryId: values.categoryId || null,
          brandId: values.brandId || null,
          shortDescription: values.shortDescription?.trim() || undefined,
          imageUrl: values.imageUrl || undefined,
          imagePublicId: values.imagePublicId || undefined,
          isFeatured: Boolean(values.isFeatured),
        };

        if (editingId) {
          await apiPatch(`/admin/products/${editingId}`, body);
        } else {
          await apiPost('/admin/products', body);
        }
        setShowForm(false);
        await load();
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
            key === 'imageUrl'
          ) {
            setFormError(key, { type: 'server', message });
          }
        }
        setError(firstApiErrorMessage(err, 'Save failed'));
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
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
            </div>

            <div>
              <p className="mb-2 text-xs text-[var(--admin-muted)]">
                Product image <span className="font-normal opacity-70">(optional)</span>
              </p>
              <div className="flex flex-wrap items-start gap-4">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[var(--admin-border)] bg-black/20 px-6 py-8 text-center transition hover:border-[var(--admin-accent)]">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => void onPickImage(e.target.files?.[0])}
                  />
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--admin-accent)]" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-[var(--admin-accent)]" />
                  )}
                  <span className="mt-2 text-xs text-[var(--admin-muted)]">
                    {uploading ? 'Uploading…' : 'Click to upload'}
                  </span>
                  <span className="mt-1 text-[10px] text-[var(--admin-muted)]">
                    JPG, PNG, WEBP or GIF · max 8MB
                  </span>
                </label>

                {imageUrl ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Product preview"
                      className="h-32 w-32 rounded-md border border-[var(--admin-border)] object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Remove image"
                      className="absolute -right-2 -top-2 rounded-full bg-[var(--admin-danger)] p-1 text-black"
                      onClick={() => {
                        setValue('imageUrl', '');
                        setValue('imagePublicId', '');
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
              <FieldError message={errors.imageUrl?.message} />
              <p className="mt-2 text-[11px] text-[var(--admin-muted)]">
                Slug and SKU are generated automatically from the product name.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending || uploading}
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
        {loading ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">No products found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-muted)]">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[var(--admin-border)]/70 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--admin-muted)]">
                      {p.sku}
                    </td>
                    <td className="px-4 py-3 font-mono">{formatGbp(p.price)}</td>
                    <td className="px-4 py-3 font-mono">{p.stock ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--admin-muted)]">{p.status}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="text-sm text-[var(--admin-accent)] hover:underline"
                        onClick={() => openEdit(p)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
