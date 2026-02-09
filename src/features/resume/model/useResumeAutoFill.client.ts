'use client';

import { useState } from 'react';

import { createPresignedUrl, uploadToPresignedUrl } from '@/features/uploads';
import { parseResumeSync, type ResumeParseSyncResult } from '@/entities/resumes';
import { useCommonApiErrorHandler } from '@/shared/api';

export const MAX_RESUME_PDF_SIZE = 5 * 1024 * 1024;

type UseResumeAutoFillParams = {
  authStatus: 'checking' | 'authed' | 'guest';
  onParsed: (result: ResumeParseSyncResult | null) => boolean;
};

export function useResumeAutoFill({ authStatus, onParsed }: UseResumeAutoFillParams) {
  const handleCommonApiError = useCommonApiErrorHandler({ redirectTo: '/resume' });
  const [autoFillError, setAutoFillError] = useState<string | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const handleAutoUpload = (file: File | null) => {
    if (!file || authStatus !== 'authed') return;
    if (file.type !== 'application/pdf') {
      setAutoFillError('PDF 파일만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > MAX_RESUME_PDF_SIZE) {
      setAutoFillError('이력서는 5MB 이하만 업로드할 수 있습니다.');
      return;
    }

    setAutoFillError(null);
    setIsAutoFilling(true);

    (async () => {
      try {
        const { presignedUrl, fileUrl: uploadedUrl } = await createPresignedUrl({
          target_type: 'RESUME_PDF',
          file_name: file.name,
          file_size: file.size,
        });
        await uploadToPresignedUrl(file, presignedUrl);
        const data = await parseResumeSync({ file_url: uploadedUrl, mode: 'sync' });
        const applied = onParsed(data.result);
        if (!applied) {
          setAutoFillError('이력서 자동 등록에 실패했습니다.');
        }
      } catch (error) {
        if (await handleCommonApiError(error)) {
          setIsAutoFilling(false);
          return;
        }
        setAutoFillError(
          error instanceof Error ? error.message : '이력서 자동 등록에 실패했습니다.',
        );
      } finally {
        setIsAutoFilling(false);
      }
    })();
  };

  return { autoFillError, isAutoFilling, handleAutoUpload };
}
