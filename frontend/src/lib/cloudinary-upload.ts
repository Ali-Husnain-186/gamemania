import { apiPost, ApiError, getAccessToken, getApiUrl, getGuestId } from '@/lib/api';

export type CloudinarySignResponse = {
  timestamp: number;
  signature: string;
  folder: string;
  cloudName: string;
  apiKey: string;
  uploadUrl: string;
};

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']);

function isAllowedImage(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  if (ALLOWED_TYPES.has(type)) return true;
  if (/\.(jpe?g|png|webp|gif)$/i.test(name)) return true;
  return false;
}

/** Preferred path: upload via our API (works reliably behind Nginx / live). */
async function uploadViaApi(file: File): Promise<CloudinaryUploadResult> {
  const body = new FormData();
  body.append('file', file);

  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const guestId = getGuestId();
  if (guestId) headers.set('X-Guest-Id', guestId);
  // Do NOT set Content-Type — browser sets multipart boundary.

  const res = await fetch(`${getApiUrl()}/admin/uploads/image`, {
    method: 'POST',
    headers,
    credentials: 'include',
    cache: 'no-store',
    body,
  });

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const err = json as { error?: { message?: string; code?: string } } | null;
    throw new ApiError(
      res.status,
      err?.error?.message ?? `Image upload failed (${res.status})`,
      err?.error?.code ?? 'UPLOAD_FAILED',
    );
  }

  const payload = json as { data?: CloudinaryUploadResult; url?: string; publicId?: string } | null;
  const data = payload?.data ?? payload;
  if (!data?.url || !data?.publicId) {
    throw new ApiError(500, 'Upload succeeded but image URL was missing', 'UPLOAD_INVALID');
  }

  return { url: data.url, publicId: data.publicId };
}

/** Fallback: signed direct-to-Cloudinary upload. */
async function uploadViaSignedCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const sign = await apiPost<CloudinarySignResponse>('/admin/uploads/sign');

  const body = new FormData();
  body.append('file', file);
  body.append('api_key', sign.apiKey);
  body.append('timestamp', String(sign.timestamp));
  body.append('signature', sign.signature);
  body.append('folder', sign.folder);

  const res = await fetch(sign.uploadUrl, { method: 'POST', body });
  const json = (await res.json()) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  };

  if (!res.ok || !json.secure_url || !json.public_id) {
    throw new ApiError(
      res.status || 500,
      json.error?.message ?? 'Image upload failed. Please try again.',
      'CLOUDINARY_UPLOAD_FAILED',
    );
  }

  return { url: json.secure_url, publicId: json.public_id };
}

export async function uploadProductImage(file: File): Promise<CloudinaryUploadResult> {
  if (!isAllowedImage(file)) {
    throw new Error('Please choose a JPG, PNG, WEBP or GIF image.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be 8MB or smaller.');
  }

  try {
    return await uploadViaApi(file);
  } catch (primaryErr) {
    // If Cloudinary env is missing on API, surface that clearly — don't mask with Cloudinary fallback.
    if (primaryErr instanceof ApiError && primaryErr.code === 'CLOUDINARY_NOT_CONFIGURED') {
      throw primaryErr;
    }
    try {
      return await uploadViaSignedCloudinary(file);
    } catch {
      throw primaryErr;
    }
  }
}
