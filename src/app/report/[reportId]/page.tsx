import { ReportDetailPage } from '@/widgets/report';

type ReportDetailRouteProps = {
  params: Promise<{
    reportId: string;
  }>;
};

export default async function ReportDetailRoutePage({ params }: ReportDetailRouteProps) {
  const { reportId: rawReportId } = await params;
  const reportId = Number(rawReportId);

  if (Number.isNaN(reportId)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f7f7] text-sm text-neutral-600">
        잘못된 리포트 정보입니다.
      </div>
    );
  }

  return <ReportDetailPage reportId={reportId} />;
}
