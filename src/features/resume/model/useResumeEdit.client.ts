import { getMe, useAuthGate } from '@/features/auth';
import { useResumeEditForm } from './useResumeEditForm.client';
import { useResumeEditLoader } from './useResumeEditLoader.client';
import { useResumeAutoFill } from './useResumeAutoFill.client';
import { useResumeSubmit } from './useResumeSubmit.client';

export function useResumeEdit(resumeIdParam: string | null) {
  const { status: authStatus } = useAuthGate(getMe);
  const resumeId = resumeIdParam ? Number(resumeIdParam) : null;
  const isEditMode = Boolean(resumeId && Number.isFinite(resumeId));

  const form = useResumeEditForm();
  const submit = useResumeSubmit({
    authStatus,
    isEditMode,
    resumeId,
    title: form.title,
    isFresher: form.isFresher,
    education: form.education,
    fileUrl: form.fileUrl,
    careers: form.careers,
    projects: form.projects,
    payload: form.payload,
    splitPeriod: form.splitPeriod,
  });
  const { isLoadingResume } = useResumeEditLoader({
    authStatus,
    isEditMode,
    resumeId,
    onLoaded: form.applyResumeDetail,
    onError: (message) => {
      submit.setSubmitError(message);
    },
  });
  const autoFill = useResumeAutoFill({ authStatus, onParsed: form.applyParsedResult });

  return {
    authStatus,
    resumeId,
    isEditMode,
    title: form.title,
    setTitle: form.setTitle,
    isFresher: form.isFresher,
    setIsFresher: form.setIsFresher,
    fileUrl: form.fileUrl,
    setFileUrl: form.setFileUrl,
    submitError: submit.submitError,
    autoFillError: autoFill.autoFillError,
    isSubmitting: submit.isSubmitting,
    isAutoFilling: autoFill.isAutoFilling,
    careers: form.careers,
    setCareers: form.setCareers,
    projects: form.projects,
    setProjects: form.setProjects,
    education: form.education,
    setEducation: form.setEducation,
    awards: form.awards,
    setAwards: form.setAwards,
    certificates: form.certificates,
    setCertificates: form.setCertificates,
    activities: form.activities,
    setActivities: form.setActivities,
    isLoadingResume,
    educationOptions: form.educationOptions,
    handleAutoUpload: autoFill.handleAutoUpload,
    handleSubmit: submit.handleSubmit,
  };
}
