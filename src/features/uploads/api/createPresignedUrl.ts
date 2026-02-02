import { apiFetch } from '@/shared/api';

export type PresignedTargetType = 'PROFILE_IMAGE' | 'RESUME' | 'RESUME_PDF';

export type CreatePresignedUrlPayload = {
  target_type: PresignedTargetType;
  file_name: string;
};

export type PresignedUrlResponse = {
  presignedUrl: string;
  fileUrl: string;
};

export async function createPresignedUrl(
  payload: CreatePresignedUrlPayload,
): Promise<PresignedUrlResponse> {
  const data = await apiFetch<{
    presigned_url?: string;
    file_url?: string;
    presignedUrl?: string;
    fileUrl?: string;
  }>('/bff/uploads/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const presignedUrl = data.presignedUrl ?? data.presigned_url ?? '';
  const fileUrl = data.fileUrl ?? data.file_url ?? '';
  if (!presignedUrl || !fileUrl) {
    throw new Error('UPLOAD_FAILED');
  }
  return { presignedUrl, fileUrl };
}
