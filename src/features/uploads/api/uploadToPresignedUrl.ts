export async function uploadToPresignedUrl(file: File, presignedUrl: string): Promise<void> {
  const contentType = file.type || 'application/octet-stream';
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });

  if (!res.ok) {
    throw new Error('UPLOAD_FAILED');
  }
}
