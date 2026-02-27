import type { Metadata } from 'next';
import { ExpertDetailPage } from '@/widgets/expert';
import { getExpertDetail } from '@/entities/experts';
import { PageTransition } from '@/shared/ui/page-transition';

type ExpertDetailRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({ params }: ExpertDetailRouteProps): Promise<Metadata> {
  const { id } = await params;
  const userId = Number.parseInt(id, 10);

  if (Number.isNaN(userId)) {
    return {
      title: '잘못된 전문가 정보',
      description: '요청하신 전문가 정보를 확인할 수 없습니다.',
      robots: { index: false, follow: false },
    };
  }

  try {
    const expert = await getExpertDetail(userId);
    const primaryJob = expert.jobs[0]?.name ?? '현직자';
    const skills = expert.skills.slice(0, 3).map((skill) => skill.name);
    const skillsText = skills.length > 0 ? ` · ${skills.join(', ')}` : '';
    const description = `${expert.nickname} ${primaryJob}${skillsText} 전문가 프로필을 확인하고 RE:FIT에서 커피챗 및 피드백을 요청해보세요.`;

    return {
      title: `${expert.nickname} 전문가 프로필`,
      description,
      alternates: {
        canonical: `/experts/${userId}`,
      },
      openGraph: {
        title: `${expert.nickname} 전문가 프로필 | RE:FIT`,
        description,
        images: expert.profile_image_url
          ? [
              {
                url: expert.profile_image_url,
                alt: `${expert.nickname} 프로필 이미지`,
              },
            ]
          : undefined,
      },
    };
  } catch {
    return {
      title: `전문가 프로필 #${userId}`,
      description: '현직자 프로필 정보를 확인하고 RE:FIT에서 커리어 피드백을 요청해보세요.',
      alternates: {
        canonical: `/experts/${userId}`,
      },
    };
  }
}

export default async function ExpertDetailRoute({ params }: ExpertDetailRouteProps) {
  const { id } = await params;
  const userId = Number.parseInt(id, 10);

  if (Number.isNaN(userId)) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-white px-2.5 pt-24 text-sm text-text-hint-main">
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
