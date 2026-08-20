import { compressImage } from "@/lib/imageCompression";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dxoqepdck";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";

export const CLOUDINARY_CONFIG = {
  cloudName: CLOUD_NAME,
  uploadPreset: UPLOAD_PRESET,
  apiBase: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}`
};

/**
 * Upload a file to Cloudinary. Image files are compressed before upload.
 */
export const uploadToCloudinary = async (file: File | Blob): Promise<string> => {
  let uploadFile: File | Blob = file;

  // Compress image files before upload
  if (file instanceof File && file.type.startsWith("image/")) {
    try {
      uploadFile = await compressImage(file);
    } catch (err) {
      console.warn("Image compression failed, uploading original:", err);
      uploadFile = file;
    }
  }

  const formData = new FormData();
  formData.append("file", uploadFile);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

  const response = await fetch(CLOUDINARY_CONFIG.apiBase + "/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Cloudinary upload failed");
  }

  const data = await response.json();
  return data.secure_url;
};

// ─── URL Transformation Helpers ─────────────────────────────────────────────

export interface OptimizedUrlOptions {
  width?: number;
  quality?: string;
  format?: string;
}

/**
 * Transform a Cloudinary URL by inserting optimization parameters.
 * Inserts transformations between /upload/ and the version segment (or filename).
 * Returns the original URL unchanged if it is not a valid Cloudinary URL.
 */
export const getOptimizedUrl = (
  url: string,
  options?: OptimizedUrlOptions
): string => {
  if (!url || !url.includes("/upload/")) return url;

  const transforms: string[] = [];

  if (options?.width) {
    transforms.push(`w_${options.width}`);
  }
  if (options?.quality) {
    transforms.push(`q_${options.quality}`);
  } else {
    transforms.push("q_auto");
  }
  if (options?.format) {
    transforms.push(`f_${options.format}`);
  } else {
    transforms.push("f_auto");
  }

  const transformStr = transforms.join(",");

  // Insert transforms after /upload/
  return url.replace("/upload/", `/upload/${transformStr}/`);
};

/**
 * Get a thumbnail-sized Cloudinary URL.
 * Default size: 150px square with auto quality and format.
 */
export const getThumbnailUrl = (url: string, size: number = 150): string => {
  return getOptimizedUrl(url, { width: size, quality: "auto", format: "auto" });
};

/**
 * Get a feed-optimized Cloudinary URL.
 * Default width: 1080px with auto quality and format.
 */
export const getFeedImageUrl = (url: string, width: number = 1080): string => {
  return getOptimizedUrl(url, { width, quality: "auto", format: "auto" });
};

/**
 * Get a profile avatar-optimized Cloudinary URL.
 * Default size: 200px with auto quality and format.
 */
export const getProfileAvatarUrl = (url: string, size: number = 200): string => {
  return getOptimizedUrl(url, { width: size, quality: "auto", format: "auto" });
};
