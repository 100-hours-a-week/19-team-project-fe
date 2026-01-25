import { ExpertSearchPage } from '@/widgets/expert-search';
import { PageTransition } from '@/shared/ui/page-transition';

export default function ExpertsPage() {
  return (
    <PageTransition>
      <ExpertSearchPage />
    </PageTransition>
  );
}
