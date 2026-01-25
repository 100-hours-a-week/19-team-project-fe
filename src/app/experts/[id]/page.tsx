import { ExpertDetailPage } from '@/widgets/expert-detail';
import { PageTransition } from '@/shared/ui/page-transition';

type ExpertDetailRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ExpertDetailRoute({ params }: ExpertDetailRouteProps) {
  const { id } = await params;
  const userId = Number.parseInt(id, 10);

  if (Number.isNaN(userId)) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-white px-6 pt-24 text-sm text-text-hint-main">
          잘못된 전문가 정보예요.
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <ExpertDetailPage userId={userId} />
    </PageTransition>
  );
}
