/// <reference lib="webworker" />

type ImageProcessingOptions = {
  maxWidth: number;
  maxHeight: number;
  mimeType: string;
  quality: number;
};

type WorkerMessage = {
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

async function processImage(file: File, options: ImageProcessingOptions) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const ratio = Math.min(options.maxWidth / bitmap.width, options.maxHeight / bitmap.height, 1);
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('CANVAS_CONTEXT_UNAVAILABLE');
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: options.mimeType, quality: options.quality });
  return new File([blob], renameFile(file.name, options.mimeType), {
    type: blob.type,
    lastModified: Date.now(),
  });
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, file, options } = event.data;
  try {
    if (!file.type.startsWith('image/')) {
      throw new Error('INVALID_IMAGE_TYPE');
    }

    const processed = await processImage(file, options);
    const response: WorkerResponse = { id, file: processed };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      error: error instanceof Error ? error.message : 'IMAGE_PROCESS_FAILED',
    };
    self.postMessage(response);
  }
};
