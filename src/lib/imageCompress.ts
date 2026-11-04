/**
 * Shrinks a photo in the browser before upload, whatever its original size:
 * scales it down to `maxDimension` (longest side) and re-encodes it as WebP
 * (JPEG where WebP encoding is unsupported), lowering quality until it fits
 * `maxBytes`. Keeps Supabase storage use small on the free plan.
 */
export interface CompressOptions {
  maxDimension: number;
  maxBytes: number;
}

export const AVATAR_COMPRESSION: CompressOptions = { maxDimension: 512, maxBytes: 200 * 1024 };
export const POST_IMAGE_COMPRESSION: CompressOptions = { maxDimension: 2048, maxBytes: 900 * 1024 };

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This photo format cannot be read. Please use a JPEG, PNG or WebP photo.'));
    };
    img.src = url;
  });

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

export async function compressImage(file: File, { maxDimension, maxBytes }: CompressOptions): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a photo (JPEG, PNG or WebP).');
  }

  const img = await loadImage(file);
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
  let width = Math.max(1, Math.round(img.naturalWidth * scale));
  let height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process this photo.');

  // WebP where the browser can encode it (Safari < 16 cannot), else JPEG.
  const probe = await toBlob(Object.assign(document.createElement('canvas'), { width: 1, height: 1 }), 'image/webp', 0.8);
  const type = probe?.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
  const ext = type === 'image/webp' ? 'webp' : 'jpg';

  let blob: Blob | null = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#ffffff'; // transparent PNGs get a white background in JPEG
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    for (const quality of [0.82, 0.72, 0.62, 0.5]) {
      blob = await toBlob(canvas, type, quality);
      if (blob && blob.size <= maxBytes) break;
    }
    if (blob && blob.size <= maxBytes) break;
    // Still too big at low quality: shrink dimensions and try again.
    width = Math.max(1, Math.round(width * 0.8));
    height = Math.max(1, Math.round(height * 0.8));
  }

  if (!blob) throw new Error('Could not process this photo.');
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${baseName}.${ext}`, { type, lastModified: Date.now() });
}
