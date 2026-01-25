'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { getExpertDetail, type ExpertDetail } from '@/entities/experts';
import { Button } from '@/shared/ui/button';
import profileBasic from '@/shared/icons/profile_basic.png';
import iconMark from '@/shared/icons/icon-mark.png';
import ExpertDetailHeader from './ExpertDetailHeader';

type ExpertDetailPageProps = {
  userId: number;
};

export default function ExpertDetailPage({ userId }: ExpertDetailPageProps) {
  const [expert, setExpert] = useState<ExpertDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const data = await getExpertDetail(userId);
        if (isMounted) setExpert(data);
      } catch (error) {
        if (isMounted) {
          const message = error instanceof Error ? error.message : '알 수 없는 오류';
          setErrorMessage(message);
          setExpert(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  return (
    <div className="min-h-screen bg-white">
      <ExpertDetailHeader />
      <section className="px-6 pt-[calc(var(--app-header-height)+16px)]">
        {isLoading ? (
          <p className="text-sm text-text-hint-main">불러오는 중...</p>
        ) : errorMessage ? (
          <p className="text-sm text-red-500">에러: {errorMessage}</p>
        ) : expert ? (
          <div className="flex flex-col gap-6 pb-[calc(96px+24px)]">
            <div className="flex items-center gap-4">
              <Image
                src={profileBasic}
                alt={`${expert.nickname} 프로필`}
                width={72}
                height={72}
                className="h-[72px] w-[72px] rounded-full object-cover"
              />
              <div className="flex flex-col gap-1">
                <span className="text-lg font-semibold text-text-body">{expert.nickname}</span>
                <span className="text-sm text-text-caption">
                  {expert.company_name} · {expert.jobs[0]?.name ?? '직무 정보 없음'}
                </span>
                <span className="text-xs text-text-hint-main">{expert.career_level.level}</span>
              </div>
            </div>

            <div className="rounded-2xl bg-[#f7f7f7] p-4 text-sm text-text-body">
              {expert.introduction || '소개가 아직 없어요.'}
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-hint-main">현직자 정보를 찾을 수 없어요.</p>
        )}
      </section>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[600px] -translate-x-1/2 bg-white/90 px-6 pb-6 pt-3">
        <Button type="button" icon={<Image src={iconMark} alt="" width={18} height={18} />}>
          채팅 요청하기
        </Button>
      </div>
    </div>
  );
}
