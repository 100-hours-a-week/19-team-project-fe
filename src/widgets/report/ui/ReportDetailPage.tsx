'use client';

import { useRouter } from 'next/navigation';

import { KakaoLoginButton } from '@/features/auth';
import { useReportDetail } from '@/features/report';
import { formatKstDateTime } from '@/shared/lib/dateTime';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

export default function ReportDetailPage({ reportId }: { reportId: number }) {
  const router = useRouter();
  const { authStatus, report, isLoading, loadError } = useReportDetail(reportId);
  const result = parseReportResult(report?.resultJson);

  const handleAuthSheetClose = () => {
    router.replace('/report');
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <Header />

      <section className="flex flex-1 flex-col px-2.5 pb-[calc(var(--app-footer-height)+16px)] pt-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.replace('/report')}
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
          <h1 className="text-2xl font-semibold text-black">리포트 상세</h1>
        </div>

        {authStatus === 'checking' ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">불러오는 중...</p>
          </div>
        ) : authStatus !== 'authed' ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">로그인이 필요합니다.</p>
          </div>
        ) : isLoading ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">리포트를 불러오는 중...</p>
          </div>
        ) : loadError ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-red-500">{loadError}</p>
          </div>
        ) : report ? (
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <p className="text-lg font-semibold text-text-title">{report.title}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-text-caption">상태:</span>
                <span className="rounded-full bg-[var(--color-primary-active)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary-main)]">
                  {report.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-text-caption">
                {formatKstDateTime(report.updatedAt, {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}{' '}
                업데이트
              </p>
              {report.jobPostUrl ? (
                <a
                  href={report.jobPostUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm font-semibold text-primary-main underline"
                >
                  채용공고 링크
                </a>
              ) : null}
            </div>

            {result?.basic_info ? (
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                <p className="text-sm font-semibold text-text-title">기본 정보</p>
                <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-neutral-800">
                  <p>리포트 날짜: {result.basic_info.report_date ?? '-'}</p>
                  <p>공고 제목: {result.basic_info.job_post_title ?? '-'}</p>
                  <p>포지션: {result.basic_info.job_post_position ?? '-'}</p>
                </div>
              </section>
            ) : null}

            {result?.overall_evaluation ? (
              <section className="rounded-2xl border border-[var(--color-primary-active)] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                <p className="text-sm font-semibold text-text-title">종합 평가</p>
                <div className="mt-3 flex gap-2 text-sm">
                  <span className="rounded-full bg-[var(--color-primary-active)] px-3 py-1 font-semibold text-[var(--color-primary-main)]">
                    직무 적합도: {result.overall_evaluation.job_fit ?? '-'}
                  </span>
                  <span className="rounded-full bg-[var(--color-primary-active)] px-3 py-1 font-semibold text-[var(--color-primary-main)]">
                    서류 통과 가능성: {result.overall_evaluation.pass_probability ?? '-'}
                  </span>
                </div>
              </section>
            ) : null}

            {result?.capability_matching?.matches?.length ? (
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                <p className="text-sm font-semibold text-text-title">핵심 요구사항 매칭</p>
                <div className="mt-3 flex flex-col gap-3">
                  {result.capability_matching.matches.map((match, index) => (
                    <div
                      key={`${match.requirement}-${index}`}
                      className="rounded-xl border border-gray-100 bg-neutral-50 p-3"
                    >
                      <p className="text-sm font-semibold text-neutral-900">{match.requirement}</p>
                      <p className="mt-1 text-xs text-neutral-600">
                        멘토 평가: {match.mentor_assessment ?? '-'} / AI 평가:{' '}
                        {match.ai_assessment ?? '-'}
                      </p>
                      {match.mentor_reason ? (
                        <p className="mt-2 text-sm text-neutral-800">
                          멘토 근거: {match.mentor_reason}
                        </p>
                      ) : null}
                      {match.ai_reason ? (
                        <p className="mt-1 text-sm text-neutral-700">AI 근거: {match.ai_reason}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {result?.strengths_analysis || result?.improvements_analysis ? (
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                <p className="text-sm font-semibold text-text-title">강점 / 보완점</p>
                <div className="mt-3 grid grid-cols-1 gap-3">
                  {result.strengths_analysis ? (
                    <div className="rounded-xl border border-gray-100 bg-neutral-50 p-3">
                      <p className="text-xs font-semibold text-neutral-500">강점</p>
                      <p className="mt-1 text-sm text-neutral-800">
                        {result.strengths_analysis.ai_reason ?? '-'}
                      </p>
                      <ChipRow title="공통" items={result.strengths_analysis.common_strengths} />
                      <ChipRow title="AI" items={result.strengths_analysis.ai_only_strengths} />
                      <ChipRow
                        title="멘토"
                        items={result.strengths_analysis.mentor_only_strengths}
                      />
                    </div>
                  ) : null}
                  {result.improvements_analysis ? (
                    <div className="rounded-xl border border-gray-100 bg-neutral-50 p-3">
                      <p className="text-xs font-semibold text-neutral-500">보완점</p>
                      <p className="mt-1 text-sm text-neutral-800">
                        {result.improvements_analysis.ai_reason ?? '-'}
                      </p>
                      <ChipRow
                        title="공통"
                        items={result.improvements_analysis.common_improvements}
                      />
                      <ChipRow
                        title="AI"
                        items={result.improvements_analysis.ai_only_improvements}
                      />
                      <ChipRow
                        title="멘토"
                        items={result.improvements_analysis.mentor_only_improvements}
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {result?.action_plan ? (
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                <p className="text-sm font-semibold text-text-title">2주 액션 플랜</p>
                <ListBlock title="AI 추천 액션" items={result.action_plan.ai_actions} />
                <ListBlock title="멘토 추천 액션" items={result.action_plan.mentor_actions} />
              </section>
            ) : null}

            {result?.reliability ? (
              <section className="rounded-2xl border border-[var(--color-primary-active)] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                <p className="text-sm font-semibold text-text-title">신뢰도</p>
                <ConfidenceMeter score={result.reliability.confidence_score ?? 0} />
                <p className="mt-1 text-sm text-neutral-700">
                  {result.reliability.confidence_reason ?? ''}
                </p>
                <ChipRow title="검증 어려운 항목" items={result.reliability.unverifiable_items} />
              </section>
            ) : null}

            {result?.final_comment ? (
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                <p className="text-sm font-semibold text-text-title">최종 코멘트</p>
                <p className="mt-2 text-sm text-neutral-800">
                  AI: {result.final_comment.ai_comment ?? '-'}
                </p>
                <p className="mt-2 text-sm text-neutral-800">
                  멘토: {result.final_comment.mentor_comment ?? '-'}
                </p>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">리포트를 찾을 수 없습니다.</p>
          </div>
        )}
      </section>

      <Footer />

      <AuthGateSheet
        open={authStatus === 'guest'}
        title="로그인이 필요합니다"
        description="리포트를 보려면 로그인해 주세요."
        onClose={handleAuthSheetClose}
      >
        <KakaoLoginButton />
      </AuthGateSheet>
    </div>
  );
}

function ConfidenceMeter({ score }: { score: number }) {
  const normalized = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0;
  return (
    <div className="mt-3 rounded-xl border border-gray-100 bg-neutral-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-neutral-500">신뢰 점수</p>
        <span className="rounded-full bg-[var(--color-primary-main)] px-2.5 py-1 text-xs font-semibold text-white">
          {normalized}점
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-[var(--color-primary-main)] transition-all duration-500"
          style={{ width: `${normalized}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-neutral-500">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
}

function ChipRow({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-xs font-semibold text-neutral-500">{title}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.filter(Boolean).map((item) => (
          <span
            key={`${title}-${item}`}
            className="rounded-full bg-white px-2.5 py-1 text-xs text-neutral-700"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  const filtered = (items ?? []).filter((item) => item && item.trim().length > 0);
  if (filtered.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-neutral-500">{title}</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-neutral-800">
        {filtered.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

type ReportResultShape = {
  basic_info?: {
    report_date?: string;
    job_post_title?: string;
    job_post_position?: string;
  };
  overall_evaluation?: {
    job_fit?: string;
    pass_probability?: string;
  };
  capability_matching?: {
    matches?: Array<{
      requirement?: string;
      mentor_assessment?: string;
      ai_assessment?: string;
      mentor_reason?: string;
      ai_reason?: string;
    }>;
  };
  strengths_analysis?: {
    ai_reason?: string;
    common_strengths?: string[];
    ai_only_strengths?: string[];
    mentor_only_strengths?: string[];
  };
  improvements_analysis?: {
    ai_reason?: string;
    common_improvements?: string[];
    ai_only_improvements?: string[];
    mentor_only_improvements?: string[];
  };
  action_plan?: {
    ai_actions?: string[];
    mentor_actions?: string[];
  };
  reliability?: {
    confidence_score?: number;
    confidence_reason?: string;
    unverifiable_items?: string[];
  };
  final_comment?: {
    ai_comment?: string;
    mentor_comment?: string;
  };
};

function parseReportResult(value: unknown): ReportResultShape | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as ReportResultShape;
}
