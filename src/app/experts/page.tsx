import type { Metadata } from 'next';
import { ExpertSearchPage } from '@/widgets/expert';
import { PageTransition } from '@/shared/ui/page-transition';

export const metadata: Metadata = {
  title: '직무·스택별 현직자 전문가 찾기',
  description:
    '백엔드, 프론트엔드, 데이터 등 직무별 현직자 전문가를 탐색하고 내 상황에 맞는 피드백을 받아보세요.',
  alternates: {
    canonical: '/experts',
  },
  openGraph: {
    title: '직무·스택별 현직자 전문가 찾기 | RE:FIT',
    description:
      '백엔드, 프론트엔드, 데이터 등 직무별 현직자 전문가를 탐색하고 내 상황에 맞는 피드백을 받아보세요.',
  },
};

export default function ExpertsPage() {
  return (
    <PageTransition>
      <ExpertSearchPage />
    </PageTransition>
  );
}
