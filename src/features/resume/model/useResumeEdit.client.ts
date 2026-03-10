'use client';

import { useEffect } from 'react';

import { useAuthStatus } from '@/entities/auth';
import { EDUCATION_OPTIONS, useResumeEditStore } from './resumeEditStore.client';
import { useResumeEditLoader } from './useResumeEditLoader.client';
import { useResumeAutoFill } from './useResumeAutoFill.client';
import { useResumeSubmit } from './useResumeSubmit.client';

export function useResumeEdit(resumeIdParam: string | null) {
  const { status: authStatus } = useAuthStatus();
  const resumeId = resumeIdParam ? Number(resumeIdParam) : null;
  const isEditMode = Boolean(resumeId && Number.isFinite(resumeId));

  const resetForm = useResumeEditStore((state) => state.resetForm);
  const applyResumeDetail = useResumeEditStore((state) => state.applyResumeDetail);

  useEffect(() => {
    resetForm();
  }, [resetForm, resumeIdParam]);

  const submit = useResumeSubmit({
    authStatus,
    isEditMode,
    resumeId,
  });

  const { isLoadingResume } = useResumeEditLoader({
    authStatus,
    isEditMode,
    resumeId,
    onLoaded: applyResumeDetail,
    onError: (message) => {
      submit.setSubmitError(message);
    },
  });

  const autoFill = useResumeAutoFill({ authStatus });

  return {
    authStatus,
    resumeId,
    isEditMode,
    submitError: submit.submitError,
    autoFillError: autoFill.autoFillError,
    isSubmitting: submit.isSubmitting,
    isAutoFilling: autoFill.isAutoFilling,
    isLoadingResume,
    educationOptions: EDUCATION_OPTIONS,
    handleAutoUpload: autoFill.handleAutoUpload,
    handleSubmit: submit.handleSubmit,
  };
}
