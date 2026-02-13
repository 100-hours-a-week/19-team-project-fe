'use client';

type ImageProcessingOptions = {
  maxWidth: number;
  maxHeight: number;
  mimeType: string;
  quality: number;
};

type WorkerRequest = {
  id: number;
  file: File;
  options: ImageProcessingOptions;
};

type WorkerResponse = {
  id: number;
  file?: File;
  error?: string;
};

const extensionByMime: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

function renameFile(originalName: string, mimeType: string) {
  const extension = extensionByMime[mimeType] ?? 'webp';
  const safeName = originalName.replace(/\.[^/.]+$/, '');
  return `${safeName}.${extension}`;
}

async function processImageOnMainThread(file: File, options: ImageProcessingOptions) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const ratio = Math.min(options.maxWidth / bitmap.width, options.maxHeight / bitmap.height, 1);
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));

  const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
  const canvas = hasOffscreenCanvas
    ? new OffscreenCanvas(width, height)
    : (document.createElement('canvas') as HTMLCanvasElement);

  if (!hasOffscreenCanvas) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('CANVAS_CONTEXT_UNAVAILABLE');
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob: Blob | null = null;
  if (canvas instanceof OffscreenCanvas) {
    blob = await canvas.convertToBlob({ type: options.mimeType, quality: options.quality });
  } else {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, options.mimeType, options.quality),
    );
  }

  if (!blob) {
    throw new Error('IMAGE_ENCODE_FAILED');
  }

  return new File([blob], renameFile(file.name, options.mimeType), {
    type: blob.type,
    lastModified: Date.now(),
  });
}

let worker: Worker | null = null;
let jobId = 0;
const pendingJobs = new Map<
  number,
  { resolve: (file: File) => void; reject: (error: Error) => void }
>();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./imageProcess.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { id, file, error } = event.data;
      const job = pendingJobs.get(id);
      if (!job) return;
      pendingJobs.delete(id);
      if (file) {
        job.resolve(file);
      } else {
        job.reject(new Error(error || 'IMAGE_PROCESS_FAILED'));
      }
    };
    worker.onerror = (event) => {
      const error = new Error(event.message || 'IMAGE_PROCESS_FAILED');
      pendingJobs.forEach((job) => job.reject(error));
      pendingJobs.clear();
    };
  }
  return worker;
}

export async function processImageFile(file: File, options: ImageProcessingOptions) {
  if (!file.type.startsWith('image/')) {
    throw new Error('INVALID_IMAGE_TYPE');
  }

  const canUseWorker =
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' &&
    typeof createImageBitmap !== 'undefined';

  if (!canUseWorker) {
    return processImageOnMainThread(file, options);
  }

  return new Promise<File>((resolve, reject) => {
    const id = ++jobId;
    pendingJobs.set(id, { resolve, reject });
    const request: WorkerRequest = { id, file, options };
    getWorker().postMessage(request);
  });
}

export type { ImageProcessingOptions };
