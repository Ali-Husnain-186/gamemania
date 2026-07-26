import { apiPost, ApiError } from '@/lib/api';

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
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function uploadProductImage(file: File): Promise<CloudinaryUploadResult> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Please choose a JPG, PNG, WEBP or GIF image.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be 8MB or smaller.');
  }

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
