import type { Metadata } from 'next';
import { ExpertSearchPage } from '@/widgets/expert';
import { PageTransition } from '@/shared/ui/page-transition';

export const metadata: Metadata = {
  title: '직무·스택별 현직자 전문가 찾기',
  description:
    '직무·기술 스택별 현직자를 탐색하고, 내 상황에 맞는 커피챗·피드백 요청으로 커리어 전략을 구체화하세요.',
  alternates: {
    canonical: '/experts',
  },
  openGraph: {
    title: '직무·스택별 현직자 전문가 찾기 | RE:FIT',
    description:
      '직무·기술 스택별 현직자를 탐색하고, 내 상황에 맞는 커피챗·피드백 요청으로 커리어 전략을 구체화하세요.',
  },
};

export default function ExpertsPage() {
  return (
    <PageTransition>
      <ExpertSearchPage />
    </PageTransition>
  );
}
