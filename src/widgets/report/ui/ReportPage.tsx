'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { KakaoLoginButton } from '@/features/auth';
import { useReportList } from '@/features/report';
import { formatKstDateTime } from '@/shared/lib/dateTime';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import charReport from '@/shared/icons/char_report.png';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

const REPORT_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

export default function ReportPage() {
  const router = useRouter();
  const {
    authStatus,
    reports,
    isLoadingReports,
    loadError,
    openMenuId,
    setOpenMenuId,
    isDeletingId,
    handleDeleteReport,
  } = useReportList();

  const handleAuthSheetClose = () => {
    router.replace('/');
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#eef1f6] text-black">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 left-[-120px] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(53,85,139,0.18)_0%,_rgba(53,85,139,0)_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-72 right-[-160px] h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(101,119,140,0.12)_0%,_rgba(101,119,140,0)_72%)]"
      />
      <Header />

      <section className="relative z-10 flex flex-1 flex-col px-2.5 pb-[calc(var(--app-footer-height)+16px)] pt-6">
        <div className="mt-3 rounded-3xl border border-white/60 bg-[linear-gradient(135deg,#35558b_0%,#65778c_100%)] px-5 py-5 text-white shadow-[0_16px_36px_rgba(31,46,71,0.25)]">
          <p className="text-xs font-semibold tracking-[0.14em] text-white/80">REPORT INSIGHT</p>
          <p className="mt-2 text-lg font-semibold leading-snug">
            피드백 기반 리포트를 모아 보고
            <br />
            개선 흐름을 한눈에 확인하세요
          </p>
          <div className="mt-4 inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold">
            총 {reports.length}개
          </div>
        </div>

        {authStatus === 'checking' ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">불러오는 중...</p>
          </div>
        ) : authStatus !== 'authed' ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">로그인이 필요합니다.</p>
          </div>
        ) : isLoadingReports ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">리포트를 불러오는 중...</p>
          </div>
        ) : loadError ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-red-500">{loadError}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="mt-6 flex flex-1 items-center justify-center">
            <Image src={charReport} alt="리포트" className="h-72 w-auto animate-float" priority />
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {reports.map((report) => (
              <div
                key={report.reportId}
                className="relative rounded-2xl border border-[#dde5ef] bg-white px-5 py-4 shadow-[0_14px_32px_rgba(23,33,52,0.08)]"
              >
                <div
                  aria-hidden="true"
                  className="absolute bottom-3 left-3 top-3 w-1.5 rounded-full bg-gradient-to-b from-[#35558b] to-[#8aa0bf]"
                />
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/report/${report.reportId}`)}
                    className="min-w-0 flex-1 pl-4 text-left"
                  >
                    <p className="truncate text-[15px] font-semibold text-[#1f2f46]">
                      {report.title}
                    </p>
                    <p className="mt-2 inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-2xs font-semibold text-[#35558b]">
                      {report.status?.toUpperCase() === 'PROCESSING' ? 'PROCESSING' : 'REPORT'}
                    </p>
                    <p className="mt-2 text-xs text-[#6b7b92]">
                      {formatKstDateTime(
                        report.updatedAt || report.createdAt,
                        REPORT_DATETIME_OPTIONS,
                      )}{' '}
                      업데이트
                    </p>
                  </button>
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      aria-label="리포트 옵션"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId((prev) =>
                          prev === report.reportId ? null : report.reportId,
                        );
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-100 text-gray-500"
                    >
                      <svg
                        data-slot="icon"
                        fill="none"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        className="h-4 w-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {openMenuId === report.reportId ? (
                  <div className="absolute right-4 top-10 z-10 w-28 border border-gray-100 bg-white py-2 shadow-lg">
                    <button
                      type="button"
                      disabled={isDeletingId === report.reportId}
                      onClick={() => {
                        setOpenMenuId(null);
                        void handleDeleteReport(report.reportId);
                      }}
                      className="w-full px-2.5 py-2 text-left text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      {isDeletingId === report.reportId ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
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
