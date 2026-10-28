/**
 * Client-side image compression utility using an off-screen HTMLCanvasElement.
 * Scales down images exceeding `maxDimension` while strictly preserving aspect ratio,
 * and encodes as `image/webp` (with automatic fallback to `image/jpeg`).
 */

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

export async function compressImageWithMeta(
  fileOrBase64: File | string,
  maxDimension = 1920,
  quality = 0.75
): Promise<{ dataUrl: string; aspectRatio: number }> {
  const sourceUrl =
    typeof fileOrBase64 === 'string'
      ? fileOrBase64
      : await readFileAsDataUrl(fileOrBase64);

  const img = await loadImageElement(sourceUrl);
  const origWidth = img.naturalWidth || img.width || 1600;
  const origHeight = img.naturalHeight || img.height || 900;
  const aspectRatio = origWidth > 0 && origHeight > 0 ? origWidth / origHeight : 16 / 9;

  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (origWidth > maxDimension || origHeight > maxDimension) {
    if (origWidth >= origHeight) {
      targetWidth = maxDimension;
      targetHeight = Math.max(1, Math.round(maxDimension / aspectRatio));
    } else {
      targetHeight = maxDimension;
      targetWidth = Math.max(1, Math.round(maxDimension * aspectRatio));
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { dataUrl: sourceUrl, aspectRatio };
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Try image/webp first; fallback to image/jpeg if WebP encoding is unsupported
  let compressedDataUrl = canvas.toDataURL('image/webp', quality);
  if (!compressedDataUrl.startsWith('data:image/webp')) {
    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  return {
    dataUrl: compressedDataUrl,
    aspectRatio,
  };
}

export async function compressImage(
  fileOrBase64: File | string,
  maxDimension = 1920,
  quality = 0.75
): Promise<string> {
  const { dataUrl } = await compressImageWithMeta(
    fileOrBase64,
    maxDimension,
    quality
  );
  return dataUrl;
}
