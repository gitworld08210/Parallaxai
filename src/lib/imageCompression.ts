/**
 * Client-side image compression using the Canvas API.
 * Resizes images to a max width and compresses them.
 * - For formats with alpha channels (PNG, GIF, WebP), exports as WebP to preserve transparency.
 * - For other formats (JPEG, etc.), exports as JPEG.
 */

export interface CompressOptions {
  maxWidth?: number;
  quality?: number;
}

const DEFAULT_MAX_WIDTH = 1080;
const DEFAULT_QUALITY = 0.8;
const SKIP_THRESHOLD_BYTES = 100 * 1024; // 100KB

/** MIME types that may contain alpha channel data */
const ALPHA_CAPABLE_TYPES = ['image/png', 'image/gif', 'image/webp'];

/**
 * Compress an image file using an offscreen canvas.
 * - Skips compression for files already under 100KB.
 * - Skips compression for non-image types.
 * - Resizes to maxWidth (default 1080px) preserving aspect ratio.
 * - Uses WebP output for alpha-capable formats (PNG, GIF, WebP) to preserve transparency.
 * - Uses JPEG output for opaque formats at the given quality (default 0.8).
 */
export const compressImage = (
  file: File,
  options?: CompressOptions
): Promise<Blob> => {
  const maxWidth = options?.maxWidth ?? DEFAULT_MAX_WIDTH;
  const quality = options?.quality ?? DEFAULT_QUALITY;

  // Skip non-image files
  if (!file.type.startsWith("image/")) {
    return Promise.resolve(file);
  }

  // Skip files already under the threshold
  if (file.size <= SKIP_THRESHOLD_BYTES) {
    return Promise.resolve(file);
  }

  // Determine output format: preserve alpha for PNG/GIF/WebP, use JPEG otherwise
  const outputType = ALPHA_CAPABLE_TYPES.includes(file.type)
    ? "image/webp"
    : "image/jpeg";

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if wider than maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas toBlob returned null"));
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = url;
  });
};
