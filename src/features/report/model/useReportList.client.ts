'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStatus } from '@/entities/auth';
import {
  deleteReport,
  reportsQueryKey,
  useReportsQuery,
  type ReportSummary,
} from '@/entities/reports';
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
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useReportsQuery({ enabled: authStatus === 'authed' });

  useEffect(() => {
    if (authStatus !== 'authed') {
      setHasLoadedReports(false);
      setLoadError(null);
      setReports([]);
      return;
    }
    setReports(data?.reports ?? []);
    setHasLoadedReports(true);
  }, [authStatus, data]);

  useEffect(() => {
    if (!error) {
      setLoadError(null);
      return;
    }
    (async () => {
      if (await handleCommonApiError(error)) return;
      setLoadError(error instanceof Error ? error.message : '리포트를 불러오지 못했습니다.');
    })();
  }, [error, handleCommonApiError]);

  useEffect(() => {
    setIsLoadingReports(authStatus === 'authed' ? isLoading : false);
  }, [authStatus, isLoading]);

  useEffect(() => {
    if (!openMenuId) return;
    if (reports.some((report) => report.reportId === openMenuId)) return;
    setOpenMenuId(null);
  }, [openMenuId, reports]);

  const handleDeleteReport = async (reportId: number) => {
    if (isDeletingId) return;
    const confirmed = window.confirm('리포트를 삭제할까요?');
    if (!confirmed) return;

    setIsDeletingId(reportId);
    try {
      await deleteReport(reportId);
      queryClient.setQueryData<{ reports: ReportSummary[] } | undefined>(
        reportsQueryKey,
        (prev) => {
          if (!prev) return { reports: [] };
          return {
            ...prev,
            reports: prev.reports.filter((report) => report.reportId !== reportId),
          };
        },
      );
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
