'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';

import { KakaoLoginButton } from '@/features/auth';
import { useResumeEdit, useResumeEditStore } from '@/features/resume';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import { Button } from '@/shared/ui/button';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';
import {
  ActivitySection,
  AwardSection,
  BasicInfoSection,
  CareerSection,
  CertificateSection,
  ProjectSection,
  useRenderMetric,
} from './resume-edit-sections';

export default function ResumeEditPage() {
  useRenderMetric('ResumeEdit.Page');

  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    authStatus,
    isEditMode,
    submitError,
    autoFillError,
    isSubmitting,
    isAutoFilling,
    isLoadingResume,
    educationOptions,
    handleAutoUpload,
    handleSubmit,
  } = useResumeEdit(searchParams.get('resumeId'));

  const { title, educationValue } = useResumeEditStore(
    useShallow((state) => ({
      title: state.title,
      educationValue: state.education[0]?.value ?? '',
    })),
  );

  const validation = useMemo(() => {
    const hasTitle = title.trim().length > 0;
    const hasEducation = educationValue.trim().length > 0;
    return {
      hasTitle,
      hasEducation,
      isFormValid: hasTitle && hasEducation,
    };
  }, [title, educationValue]);

  const isSubmitDisabled =
    isSubmitting ||
    authStatus !== 'authed' ||
    isLoadingResume ||
    isAutoFilling ||
    !validation.isFormValid;

  const handleAuthSheetClose = () => {
    router.replace('/resume');
  };

  const handleAutoFill = () => {
    if (authStatus !== 'authed') return;
    document.getElementById('resume-auto-upload')?.click();
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <Header />

      <section className="flex flex-1 flex-col px-2.5 pt-6 pb-[calc(var(--app-footer-height)+16px)]">
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="resume-auto-upload"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.target.value = '';
              handleAutoUpload(file);
            }}
          />
          <button
            type="button"
            onClick={() => router.replace('/resume')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm"
            aria-label="뒤로 가기"
          >
            <svg
              data-slot="icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          {isEditMode ? <h1 className="text-2xl font-semibold text-black">이력서 수정</h1> : null}
          <button
            type="button"
            onClick={handleAutoFill}
            disabled={isAutoFilling || authStatus !== 'authed'}
            className={`ml-auto rounded-full border px-2.5 py-2 text-sm font-semibold transition ${
              isAutoFilling || authStatus !== 'authed'
                ? 'border-gray-200 bg-gray-100 text-gray-400'
                : 'border-primary-main bg-primary-main/10 text-primary-main'
            }`}
          >
            {isAutoFilling ? '자동 등록 중...' : '자동 등록'}
          </button>
        </div>

        <div className="mt-2 text-right text-xs font-semibold text-primary-main">
          5MB 이하 PDF 파일만 업로드 가능합니다.
        </div>

        {authStatus === 'checking' ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">불러오는 중...</p>
          </div>
        ) : authStatus !== 'authed' ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">로그인이 필요합니다.</p>
          </div>
        ) : isEditMode && isLoadingResume ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">이력서를 불러오는 중...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col gap-6">
            {autoFillError ? (
              <div className="rounded-2xl border border-red-100 bg-white px-2.5 py-3 text-sm text-red-500 shadow-card-soft">
                {autoFillError}
              </div>
            ) : null}

            <BasicInfoSection educationOptions={educationOptions} />
            <CareerSection />
            <ProjectSection />
            <AwardSection />
            <CertificateSection />
            <ActivitySection />

            {!validation.hasTitle ? (
              <p className="mb-0 text-sm text-red-500">이력서 제목을 입력해 주세요.</p>
            ) : null}
            {!validation.hasEducation ? (
              <p className="mb-0 text-sm text-red-500">학력 정보를 입력해 주세요.</p>
            ) : null}
            {submitError ? <p className="mb-0 text-sm text-red-500">{submitError}</p> : null}

            <Button type="submit" disabled={isSubmitDisabled}>
              {isSubmitting
                ? isEditMode
                  ? '이력서 수정 중...'
                  : '이력서 생성 중...'
                : isEditMode
                  ? '이력서 수정'
                  : '이력서 생성'}
            </Button>
          </form>
        )}
      </section>

      <Footer />

      <AuthGateSheet
        open={authStatus === 'guest'}
        title="로그인이 필요합니다"
        description="이력서를 업데이트하려면 로그인해 주세요."
        onClose={handleAuthSheetClose}
      >
        <KakaoLoginButton />
      </AuthGateSheet>
    </div>
  );
}
