'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { KakaoLoginButton, getMe } from '@/features/auth';
import { getResumeDetail, getResumes, type Resume } from '@/entities/resumes';
import { createChat, getChatList } from '@/features/chat';
import { getExpertDetail, type ExpertDetail } from '@/entities/experts';
import { BusinessError, useCommonApiErrorHandler } from '@/shared/api';
import { useAuthGate } from '@/shared/lib/useAuthGate';
import { Button } from '@/shared/ui/button';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import defaultUserImage from '@/shared/icons/char_icon.png';
import iconMark from '@/shared/icons/icon-mark.png';
import ExpertDetailHeader from './ExpertDetailHeader';

type ExpertDetailPageProps = {
  userId: number;
};

export default function ExpertDetailPage({ userId }: ExpertDetailPageProps) {
  const router = useRouter();
  const [expert, setExpert] = useState<ExpertDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumeError, setResumeError] = useState('');
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [jobPostUrl, setJobPostUrl] = useState('');
  const handleCommonApiError = useCommonApiErrorHandler();
  const { status: authStatus } = useAuthGate(getMe);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const data = await getExpertDetail(userId);
        if (isMounted) setExpert(data);
      } catch (error) {
        if (isMounted) {
          if (await handleCommonApiError(error)) {
            return;
          }
          const message = error instanceof Error ? error.message : '알 수 없는 오류';
          setErrorMessage(message);
          setExpert(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [handleCommonApiError, userId]);

  useEffect(() => {
    if (authStatus !== 'authed') {
      setResumes([]);
      setSelectedResumeId(null);
      return;
    }

    let cancelled = false;
    setIsLoadingResumes(true);
    setResumeError('');

    (async () => {
      try {
        const data = await getResumes();
        if (cancelled) return;
        setResumes(data.resumes);
        if (data.resumes.length > 0) {
          setSelectedResumeId((prev) => prev ?? data.resumes[0].resumeId);
        }
      } catch (error) {
        if (cancelled) return;
        setResumeError(error instanceof Error ? error.message : '이력서를 불러오지 못했습니다.');
        setResumes([]);
      } finally {
        if (cancelled) return;
        setIsLoadingResumes(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  const buildInitialMessage = (resume: Awaited<ReturnType<typeof getResumeDetail>>) => {
    const lines: string[] = [];
    lines.push(`공고 링크: ${jobPostUrl.trim()}`);

    lines.push('');
    lines.push('이력서 정보');
    lines.push(`- 제목: ${resume.title || '제목 없음'}`);
    lines.push(`- 구분: ${resume.isFresher ? '신입' : '경력'}`);
    if (resume.educationLevel) {
      lines.push(`- 학력: ${resume.educationLevel}`);
    }
    if (resume.fileUrl) {
      lines.push(`- 파일: ${resume.fileUrl}`);
    }

    const content = resume.contentJson ?? {};
    const careers = Array.isArray((content as { careers?: string[] }).careers)
      ? ((content as { careers?: string[] }).careers ?? [])
      : [];
    const projects = Array.isArray(
      (content as { projects?: Array<Record<string, string>> }).projects,
    )
      ? ((content as { projects?: Array<Record<string, string>> }).projects ?? [])
      : [];
    const education = Array.isArray((content as { education?: string[] }).education)
      ? ((content as { education?: string[] }).education ?? [])
      : [];
    const awards = Array.isArray((content as { awards?: string[] }).awards)
      ? ((content as { awards?: string[] }).awards ?? [])
      : [];
    const certificates = Array.isArray((content as { certificates?: string[] }).certificates)
      ? ((content as { certificates?: string[] }).certificates ?? [])
      : [];
    const activities = Array.isArray((content as { activities?: string[] }).activities)
      ? ((content as { activities?: string[] }).activities ?? [])
      : [];

    if (education.length > 0) {
      lines.push('');
      lines.push('학력');
      education.forEach((item) => lines.push(`- ${item}`));
    }

    if (careers.length > 0) {
      lines.push('');
      lines.push('경력');
      careers.forEach((item) => lines.push(`- ${item}`));
    }

    if (projects.length > 0) {
      lines.push('');
      lines.push('프로젝트');
      projects.forEach((project) => {
        const title = project.title ?? '제목 없음';
        const start = project.start_date ?? '';
        const end = project.end_date ?? '';
        const period = [start, end].filter(Boolean).join(' - ');
        const description = project.description ?? '';
        lines.push(`- ${title}${period ? ` (${period})` : ''}`);
        if (description) {
          lines.push(`  ${description}`);
        }
      });
    }

    if (awards.length > 0) {
      lines.push('');
      lines.push('수상');
      awards.forEach((item) => lines.push(`- ${item}`));
    }

    if (certificates.length > 0) {
      lines.push('');
      lines.push('자격증');
      certificates.forEach((item) => lines.push(`- ${item}`));
    }

    if (activities.length > 0) {
      lines.push('');
      lines.push('활동');
      activities.forEach((item) => lines.push(`- ${item}`));
    }

    return lines.join('\n');
  };

  const handleChatRequestClick = async () => {
    if (isCheckingAuth) return;
    setIsCheckingAuth(true);
    try {
      const auth = await getMe();
      if (!auth.authenticated) {
        setAuthSheetOpen(true);
        return;
      }
      if (!selectedResumeId) {
        alert('이력서를 선택해 주세요.');
        return;
      }
      if (!jobPostUrl.trim()) {
        alert('공고 링크를 입력해 주세요.');
        return;
      }
      const resumeDetail = await getResumeDetail(selectedResumeId);
      const initialMessage = buildInitialMessage(resumeDetail);
      const data = await createChat({
        receiver_id: userId,
        resume_id: selectedResumeId,
        job_post_url: jobPostUrl.trim(),
        request_type: 'COFFEE_CHAT',
      });
      sessionStorage.setItem(`pending-chat-message:${data.chat_id}`, initialMessage);
      router.push(`/chat/${data.chat_id}`);
    } catch (error) {
      if (
        error instanceof BusinessError &&
        (error.code === 'CHAT_ROOM_ALREADY_EXISTS' || error.code === 'CONFLICT')
      ) {
        try {
          const list = await getChatList({ status: 'ACTIVE' });
          const matched = list.chats.find(
            (chat) => chat.receiver.user_id === userId || chat.requester.user_id === userId,
          );
          if (matched) {
            const fallbackResumeId = selectedResumeId ?? resumes[0]?.resumeId ?? null;
            if (fallbackResumeId && jobPostUrl.trim()) {
              const resumeDetail = await getResumeDetail(fallbackResumeId);
              const initialMessage = buildInitialMessage(resumeDetail);
              sessionStorage.setItem(`pending-chat-message:${matched.chat_id}`, initialMessage);
            }
            router.push(`/chat/${matched.chat_id}`);
            return;
          }
        } catch (listError) {
          if (await handleCommonApiError(listError)) {
            return;
          }
          console.error('[Chat List Error]', listError);
        }
        alert('이미 채팅방이 존재하지만 이동할 수 없습니다.');
        return;
      }
      if (await handleCommonApiError(error)) {
        return;
      }
      console.error('[Chat Request Error]', error);
      alert('채팅 요청에 실패했습니다.');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <ExpertDetailHeader />
      <section className="px-6 pt-6 pb-[calc(96px+24px)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
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
        </div>

        {isLoading ? (
          <div className="mt-4 rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-neutral-700">불러오는 중...</p>
          </div>
        ) : errorMessage ? (
          <div className="mt-4 rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-red-500">에러: {errorMessage}</p>
          </div>
        ) : expert ? (
          <div className="mt-6 flex flex-col gap-6">
            <div className="rounded-3xl bg-white px-6 py-6 text-center shadow-sm">
              <div className="flex flex-col items-center">
                <Image
                  src={expert.profile_image_url || defaultUserImage}
                  alt={`${expert.nickname} 프로필`}
                  width={112}
                  height={112}
                  unoptimized={!!expert.profile_image_url}
                  className="h-24 w-24 rounded-full object-cover"
                />
                <div className="mt-3 flex items-center gap-2">
                  <p className="text-lg font-semibold text-[#3b5bcc]">{expert.nickname}</p>
                  {expert.verified ? (
                    <span className="rounded-full bg-[#edf4ff] px-2 py-0.5 text-xs font-semibold text-[#2b4b7e]">
                      인증됨
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-text-caption">
                  {expert.company_name} · {expert.jobs[0]?.name ?? '직무 정보 없음'}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
                    {expert.career_level.level}
                  </span>
                  {expert.skills.length > 0 ? (
                    expert.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]"
                      >
                        {skill.name}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
                      기술 스택 없음
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white px-6 py-5 shadow-sm">
              <p className="text-base font-semibold text-text-title">자기 소개</p>
              <p className="mt-3 text-sm text-text-body whitespace-pre-line">
                {expert.introduction || '소개가 아직 없어요.'}
              </p>
            </div>

            <div className="rounded-3xl bg-white px-6 py-5 shadow-sm">
              <p className="text-base font-semibold text-text-title">채팅 요청 첨부</p>
              <p className="mt-2 text-xs text-text-caption">
                공고 링크와 이력서를 첨부하면 더 구체적인 피드백을 받을 수 있어요.
              </p>

              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700">공고 링크</p>
                <input
                  type="url"
                  placeholder="https://example.com/job/123"
                  value={jobPostUrl}
                  onChange={(event) => setJobPostUrl(event.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-main focus:outline-none focus:ring-2 focus:ring-primary-main/20"
                />
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700">이력서 선택</p>
                {authStatus !== 'authed' ? (
                  <p className="mt-2 text-xs text-text-caption">
                    로그인 후 이력서를 선택할 수 있어요.
                  </p>
                ) : isLoadingResumes ? (
                  <p className="mt-2 text-xs text-text-caption">이력서를 불러오는 중...</p>
                ) : resumeError ? (
                  <p className="mt-2 text-xs text-red-500">{resumeError}</p>
                ) : resumes.length === 0 ? (
                  <p className="mt-2 text-xs text-text-caption">등록된 이력서가 없습니다.</p>
                ) : (
                  <select
                    value={selectedResumeId ?? undefined}
                    onChange={(event) => setSelectedResumeId(Number(event.target.value))}
                    className="mt-2 w-full appearance-none rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-main focus:outline-none focus:ring-2 focus:ring-primary-main/20"
                  >
                    {resumes.map((resume) => (
                      <option key={resume.resumeId} value={resume.resumeId}>
                        {resume.title || `이력서 ${resume.resumeId}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-neutral-700">현직자 정보를 찾을 수 없어요.</p>
          </div>
        )}
      </section>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[600px] -translate-x-1/2 bg-white/90 px-6 pb-6 pt-3">
        <Button
          type="button"
          onClick={handleChatRequestClick}
          disabled={isCheckingAuth}
          icon={<Image src={iconMark} alt="" width={18} height={18} />}
        >
          채팅 요청하기
        </Button>
      </div>

      <BottomSheet
        open={authSheetOpen}
        title="로그인이 필요합니다"
        onClose={() => setAuthSheetOpen(false)}
      >
        <div className="flex h-full flex-col gap-4">
          <div>
            <p className="mt-2 text-sm text-text-caption">채팅을 요청하려면 로그인해 주세요.</p>
          </div>
          <div className="mt-auto">
            <KakaoLoginButton />
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
