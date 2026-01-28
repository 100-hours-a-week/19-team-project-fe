import { ResumeDetailPage } from '@/widgets/resume-detail';

export default async function ResumeDetailRoute({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await params;
  const parsedId = Number(resumeId);

  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    return <ResumeDetailPage resumeId={0} />;
  }

  return <ResumeDetailPage resumeId={parsedId} />;
}
