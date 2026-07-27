import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { env } from '../config/env';
import { AppError, ValidationError } from '../exceptions/AppError';

function assertConfigured(): void {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new AppError(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server.',
      503,
      'CLOUDINARY_NOT_CONFIGURED',
    );
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function getSignedUploadParams(folder = 'game-mania/products') {
  assertConfigured();

  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    env.CLOUDINARY_API_SECRET!,
  );

  return {
    timestamp,
    signature,
    folder,
    cloudName: env.CLOUDINARY_CLOUD_NAME!,
    apiKey: env.CLOUDINARY_API_KEY!,
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
  };
}

export async function uploadImageBuffer(input: {
  buffer: Buffer;
  folder?: string;
  filename?: string;
  mimetype?: string;
}): Promise<{ url: string; publicId: string }> {
  assertConfigured();

  const folder = input.folder ?? 'game-mania/products';

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        filename_override: input.filename,
      },
      (err, uploaded) => {
        if (err || !uploaded) {
          reject(err ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve(uploaded);
      },
    );
    stream.end(input.buffer);
  });

  if (!result.secure_url || !result.public_id) {
    throw new ValidationError('Cloudinary did not return an image URL');
  }

  return { url: result.secure_url, publicId: result.public_id };
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}
