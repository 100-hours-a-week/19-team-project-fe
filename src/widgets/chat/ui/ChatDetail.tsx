'use client';

import type { CSSProperties, ReactNode } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import type { ChatDetailData, ChatParticipant } from '@/entities/chat';
import { useChatDetail } from '@/features/chat';
import charIcon from '@/shared/icons/char_icon.png';
import { BottomSheet } from '@/shared/ui/bottom-sheet';

type ChatDetailProps = {
  chatId: number;
  detail: ChatDetailData;
};

const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const EMPTY_CONTENT_LABEL = '내용이 없습니다.';

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-start justify-between gap-4 text-sm text-neutral-700">
    <span className="text-neutral-500">{label}</span>
    <span className="text-right text-neutral-900">{value}</span>
  </div>
);

const ParticipantCard = ({
  title,
  participant,
}: {
  title: string;
  participant: ChatParticipant;
}) => (
  <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
    <Image
      src={participant.profile_image_url ?? charIcon}
      alt={`${participant.nickname} 프로필`}
      width={48}
      height={48}
      unoptimized={!!participant.profile_image_url}
      className="h-12 w-12 rounded-full object-cover bg-neutral-200"
    />
    <div className="flex flex-1 flex-col gap-1">
      <div className="text-sm font-semibold text-neutral-900">{participant.nickname}</div>
      <div className="text-xs text-neutral-500">{title}</div>
    </div>
  </div>
);

export default function ChatDetail({ chatId, detail }: ChatDetailProps) {
  const router = useRouter();
  const {
    isClosed,
    isClosing,
    closeError,
    isResumeModalOpen,
    setIsResumeModalOpen,
    handleCloseChat,
    resumeDetail,
    careers,
    projects,
    education,
    awards,
    certificates,
    activities,
    summary,
    hasContent,
  } = useChatDetail(chatId, detail);
  const participants: Array<{ title: string; data: ChatParticipant }> = [
    { title: '요청자', data: detail.requester },
    { title: '수신자', data: detail.receiver },
  ];

  return (
    <div
      className="flex h-[100dvh] flex-col overflow-hidden bg-[#f7f7f7] text-black"
      style={{ '--app-header-height': '64px' } as CSSProperties}
    >
      <header className="fixed top-0 left-1/2 z-10 flex h-16 w-full max-w-[600px] -translate-x-1/2 items-center bg-white px-2.5">
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem('nav-direction', 'back');
            router.back();
          }}
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
        <div className="flex-1 px-3 text-center text-base font-semibold text-neutral-900">
          채팅 상세
        </div>
        <div className="h-9 w-9" aria-hidden="true" />
      </header>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-2.5 pb-[calc(96px+16px)] pt-[calc(var(--app-header-height)+16px)]">
        <section>
          <h2 className="text-sm font-semibold text-neutral-700">참여자</h2>
          <div className="mt-4 flex flex-col gap-3">
            {participants.map((participant) => (
              <ParticipantCard
                key={participant.title}
                title={participant.title}
                participant={participant.data}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-700">첨부 자료</h2>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-500">채용 공고</span>
              {detail.job_post_url ? (
                <a
                  href={detail.job_post_url}
                  className="text-sm font-semibold text-neutral-800 underline decoration-neutral-300 underline-offset-4"
                  target="_blank"
                  rel="noreferrer"
                >
                  채용공고 링크
                </a>
              ) : (
                <span className="text-neutral-900">—</span>
              )}
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <span className="text-neutral-500">이력서</span>
              {resumeDetail ? (
                <button
                  type="button"
                  onClick={() => setIsResumeModalOpen(true)}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-2.5 py-3 text-left text-neutral-800"
                >
                  <span className="text-sm font-semibold">{resumeDetail.title || '제목 없음'}</span>
                  <span className="text-xs font-semibold text-neutral-700">상세 보기</span>
                </button>
              ) : (
                <span className="text-neutral-900">—</span>
              )}
            </div>
            <DetailRow label="생성 일시" value={formatDateTime(detail.created_at)} />
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[600px] -translate-x-1/2 bg-[#f7f7f7] px-2.5 pb-6 pt-3">
        <button
          type="button"
          onClick={handleCloseChat}
          disabled={isClosed || isClosing}
          className="w-full rounded-2xl bg-neutral-200 py-3 text-sm font-semibold text-neutral-700 disabled:opacity-60"
        >
          {isClosed ? '채팅방 종료됨' : isClosing ? '종료 처리 중...' : '채팅방 종료하기'}
        </button>
        {closeError ? <p className="mt-2 text-center text-xs text-red-500">{closeError}</p> : null}
      </div>

      <BottomSheet
        open={isResumeModalOpen}
        title="이력서 상세"
        onClose={() => setIsResumeModalOpen(false)}
      >
        {resumeDetail ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              <p className="text-base font-semibold text-neutral-900">
                {resumeDetail.title || '제목 없음'}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {resumeDetail.isFresher ? '신입' : '경력'} ·{' '}
                {resumeDetail.educationLevel || '학력 정보 없음'}
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              {hasContent ? (
                <div className="flex flex-col gap-4 text-sm text-neutral-800">
                  {summary ? (
                    <div>
                      <p className="text-xs font-semibold text-neutral-600">요약</p>
                      <p className="mt-1 whitespace-pre-line">{summary}</p>
                    </div>
                  ) : null}

                  {careers.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-neutral-600">경력</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {careers.map((item, index) => (
                          <li key={`career-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {projects.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-neutral-600">프로젝트</p>
                      <div className="mt-2 flex flex-col gap-3">
                        {projects.map((project, index) => (
                          <div key={`project-${index}`} className="rounded-lg bg-neutral-50 p-3">
                            <p className="text-sm font-semibold text-neutral-900">
                              {project.title || `프로젝트 ${index + 1}`}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              {[project.start_date, project.end_date].filter(Boolean).join(' ~ ') ||
                                '기간 정보 없음'}
                            </p>
                            {project.description ? (
                              <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">
                                {project.description}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {education.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-neutral-600">학력</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {education.map((item, index) => (
                          <li key={`education-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {awards.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-neutral-600">수상</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {awards.map((item, index) => (
                          <li key={`award-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {certificates.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-neutral-600">자격증</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {certificates.map((item, index) => (
                          <li key={`certificate-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {activities.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-neutral-600">활동</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {activities.map((item, index) => (
                          <li key={`activity-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">{EMPTY_CONTENT_LABEL}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">이력서가 없습니다.</p>
        )}
      </BottomSheet>
    </div>
  );
}
