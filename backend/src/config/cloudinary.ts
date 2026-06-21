import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'raw' | 'auto' = 'raw'
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `careeros/${folder}`,
        resource_type: resourceType,
        type: 'authenticated',
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Upload failed'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string, resourceType: 'raw' | 'video' = 'raw'): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export async function uploadVideoToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string; duration?: number }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `careeros/${folder}`,
        resource_type: 'video',
        type: 'authenticated',
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Video upload failed'));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          duration: result.duration,
        });
      }
    );
    stream.end(buffer);
  });
}
