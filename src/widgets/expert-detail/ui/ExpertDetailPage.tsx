'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { KakaoLoginButton, getMe } from '@/features/auth';
import { createChat } from '@/features/chat';
import { getExpertDetail, type ExpertDetail } from '@/entities/experts';
import { BusinessError, HttpError } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import profileBasic from '@/shared/icons/profile_basic.png';
import iconMark from '@/shared/icons/icon-mark.png';
import ExpertDetailHeader from './ExpertDetailHeader';

type ExpertDetailPageProps = {
  userId: number;
};

export default function ExpertDetailPage({ userId }: ExpertDetailPageProps) {
  const router = useRouter();
  const [expert, setExpert] = useState<ExpertDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

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

  const handleChatRequestClick = async () => {
    if (isCheckingAuth) return;
    setIsCheckingAuth(true);
    try {
      const auth = await getMe();
      if (!auth.authenticated) {
        setAuthSheetOpen(true);
        return;
      }
      const data = await createChat({
        receiver_id: userId,
        resume_id: 1,
        job_post_url: '',
        request_type: 'COFFEE_CHAT',
      });
      router.push(`/chat/${data.chat_id}`);
    } catch (error) {
      if (error instanceof BusinessError && error.code === 'CHAT_ROOM_ALREADY_EXISTS') {
        alert('이미 채팅방이 존재합니다.');
        return;
      }
      if (error instanceof BusinessError && error.code === 'AUTH_UNAUTHORIZED') {
        setAuthSheetOpen(true);
        return;
      }
      if (error instanceof HttpError && error.status === 401) {
        setAuthSheetOpen(true);
        return;
      }
      console.error('[Chat Request Error]', error);
      alert('채팅 요청에 실패했습니다.');
    } finally {
      setIsCheckingAuth(false);
    }
  };

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
        <Button
          type="button"
          onClick={handleChatRequestClick}
          disabled={isCheckingAuth}
          icon={<Image src={iconMark} alt="" width={18} height={18} />}
        >
          채팅 요청하기
        </Button>
      </div>

      <BottomSheet
        open={authSheetOpen}
        title="로그인이 필요합니다"
        onClose={() => setAuthSheetOpen(false)}
      >
        <div className="flex h-full flex-col gap-4">
          <div>
            <p className="mt-2 text-sm text-text-caption">채팅을 요청하려면 로그인해 주세요.</p>
          </div>
          <div className="mt-auto">
            <KakaoLoginButton />
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
