/**
 * Shrinks an image in the browser before it's uploaded.
 *
 * Production sits behind nginx, which rejects request bodies over its client_max_body_size
 * with "413 Request Entity Too Large" before the request reaches the backend (1 MB by
 * default). Phone photos are usually 2–8 MB, so they were rejected even though the backend
 * itself accepts up to 15 MB. Category images are shown small, so resizing them to at most
 * `maxDimension` px and re-encoding loses nothing visible and keeps every upload far under
 * any proxy limit.
 *
 * - Files already at or under `targetBytes` are returned unchanged.
 * - Output is WebP (keeps PNG transparency). If the browser can't encode WebP, JPEG on a
 *   white background is used instead.
 * - If the image can't be decoded or encoded for any reason, the original file is returned,
 *   so this never blocks an upload that would otherwise have worked.
 */
export interface CompressImageOptions {
  /** Longest side of the output, in px. */
  maxDimension?: number
  /** Stop once the encoded file is at or under this size. */
  targetBytes?: number
}

const QUALITIES = [0.85, 0.75, 0.65]
const MIN_DIMENSION = 256

export async function compressImage(
  file: File,
  { maxDimension = 1024, targetBytes = 900 * 1024 }: CompressImageOptions = {},
): Promise<File> {
  if (file.size <= targetBytes) return file

  try {
    const img = await loadImage(file)
    const longest = Math.max(img.naturalWidth, img.naturalHeight)
    if (!longest) return file

    let dimension = Math.min(maxDimension, longest)
    let best: Blob | null = null

    while (dimension >= MIN_DIMENSION) {
      for (const quality of QUALITIES) {
        const blob = await encode(img, dimension / longest, quality)
        if (!blob) continue
        if (!best || blob.size < best.size) best = blob
        if (blob.size <= targetBytes) return toFile(blob, file.name)
      }
      dimension = Math.floor(dimension * 0.75)
    }

    // Couldn't reach the target; still upload the smallest version if it beats the original.
    return best && best.size < file.size ? toFile(best, file.name) : file
  } catch {
    return file
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image'))
    }
    img.src = url
  })
}

async function encode(img: HTMLImageElement, scale: number, quality: number): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const webp = await toBlob(canvas, 'image/webp', quality)
  if (webp && webp.type === 'image/webp') return webp

  // No WebP encoder (the browser silently fell back to PNG): use JPEG, which has no alpha
  // channel, so paint transparent areas white instead of black.
  ctx.globalCompositeOperation = 'destination-over'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  return toBlob(canvas, 'image/jpeg', quality)
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

function toFile(blob: Blob, originalName: string): File {
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const base = originalName.replace(/\.[^.]+$/, '') || 'image'
  return new File([blob], `${base}.${ext}`, { type: blob.type })
}
