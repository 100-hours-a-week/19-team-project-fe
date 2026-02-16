'use client';

import { useEffect, useMemo, useState } from 'react';

import { useAuthStatus } from '@/entities/auth';
import { deleteReport, getReports, type ReportSummary } from '@/entities/reports';
import { useCommonApiErrorHandler } from '@/shared/api';

export function useReportList() {
  const { status: authStatus } = useAuthStatus();
  const handleCommonApiError = useCommonApiErrorHandler();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [hasLoadedReports, setHasLoadedReports] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    if (authStatus !== 'authed') {
      setReports([]);
      setIsLoadingReports(false);
      setHasLoadedReports(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingReports(true);

    (async () => {
      try {
        const data = await getReports();
        if (cancelled) return;
        setReports(data.reports ?? []);
        setHasLoadedReports(true);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        if (await handleCommonApiError(error)) {
          setIsLoadingReports(false);
          return;
        }
        setHasLoadedReports(true);
        setLoadError(error instanceof Error ? error.message : '리포트를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setIsLoadingReports(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, handleCommonApiError]);

  const handleDeleteReport = async (reportId: number) => {
    if (isDeletingId) return;
    const confirmed = window.confirm('리포트를 삭제할까요?');
    if (!confirmed) return;

    setIsDeletingId(reportId);
    try {
      await deleteReport(reportId);
      setReports((prev) => prev.filter((report) => report.reportId !== reportId));
    } catch (error) {
      if (!(await handleCommonApiError(error))) {
        setLoadError(error instanceof Error ? error.message : '리포트 삭제에 실패했습니다.');
      }
    } finally {
      setIsDeletingId(null);
    }
  };

  const sortedReports = useMemo(
    () =>
      [...reports].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [reports],
  );

  return {
    authStatus,
    reports: sortedReports,
    isLoadingReports,
    hasLoadedReports,
    loadError,
    openMenuId,
    setOpenMenuId,
    isDeletingId,
    handleDeleteReport,
  };
}
