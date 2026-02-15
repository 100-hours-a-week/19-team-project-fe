'use client';

import { useEffect, useMemo, useState } from 'react';

import { useAuthStatus } from '@/entities/auth';
import { getReportDetail, type ReportDetail } from '@/entities/reports';
import { useCommonApiErrorHandler } from '@/shared/api';

export function useReportDetail(reportId: number) {
  const { status: authStatus } = useAuthStatus();
  const handleCommonApiError = useCommonApiErrorHandler();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus !== 'authed') {
      setReport(null);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const data = await getReportDetail(reportId);
        if (cancelled) return;
        setReport(data);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        if (await handleCommonApiError(error)) {
          setIsLoading(false);
          return;
        }
        setLoadError(error instanceof Error ? error.message : '리포트를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, reportId, handleCommonApiError]);

  const resultJsonText = useMemo(() => {
    if (!report) return '';
    try {
      return JSON.stringify(report.resultJson ?? {}, null, 2);
    } catch {
      return '';
    }
  }, [report]);

  return {
    authStatus,
    report,
    isLoading,
    loadError,
    resultJsonText,
  };
}
