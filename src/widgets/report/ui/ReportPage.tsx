'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { KakaoLoginButton } from '@/features/auth';
import { useReportList } from '@/features/report';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

const statusLabel: Record<string, string> = {
  PROCESSING: '분석 중',
  COMPLETED: '완료',
  FAILED: '실패',
};

export default function ReportPage() {
  const router = useRouter();
  const {
    authStatus,
    reports,
    isLoadingReports,
    hasLoadedReports,
    loadError,
    isDeletingId,
    handleDeleteReport,
  } = useReportList();
  const hasShownReportListAlertRef = useRef(false);

  useEffect(() => {
    if (
      authStatus !== 'authed' ||
      isLoadingReports ||
      !hasLoadedReports ||
      hasShownReportListAlertRef.current
    ) {
      return;
    }
    hasShownReportListAlertRef.current = true;
    window.alert(`[Reports List Response]\n${JSON.stringify({ reports }, null, 2)}`);
  }, [authStatus, isLoadingReports, hasLoadedReports, reports]);

  const handleAuthSheetClose = () => {
    router.replace('/');
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <Header />

      <section className="flex flex-1 flex-col px-2.5 pb-[calc(var(--app-footer-height)+16px)] pt-6">
        <h1 className="text-2xl font-semibold text-black">리포트</h1>

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
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">아직 생성된 리포트가 없습니다.</p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {reports.map((report, index) => (
              <div
                key={`${report.reportId}-${report.updatedAt}-${index}`}
                className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/report/${report.reportId}`)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-[14px] font-semibold text-text-title">
                      {report.title}
                    </p>
                    <p className="mt-1 text-xs text-text-caption">
                      {new Date(report.updatedAt).toLocaleDateString('ko-KR')} 업데이트
                    </p>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#edf4ff] px-2 py-0.5 text-[11px] font-semibold text-[#2b4b7e]">
                      {statusLabel[report.status] ?? report.status}
                    </span>
                    <button
                      type="button"
                      disabled={isDeletingId === report.reportId}
                      onClick={() => {
                        void handleDeleteReport(report.reportId);
                      }}
                      className="rounded-lg border border-gray-100 px-2 py-1 text-xs text-red-500"
                    >
                      {isDeletingId === report.reportId ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                </div>
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
