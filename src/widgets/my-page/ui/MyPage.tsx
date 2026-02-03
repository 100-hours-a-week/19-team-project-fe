'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { KakaoLoginButton, getMe } from '@/features/auth';
import { getExpertStatus, getUserMe, type ExpertStatus, type UserMe } from '@/features/users';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import { useAuthGate } from '@/shared/lib/useAuthGate';
import { useCommonApiErrorHandler } from '@/shared/api';
import defaultUserImage from '@/shared/icons/char_icon.png';
import iconCertification from '@/shared/icons/icon_certification.png';
import iconInquiry from '@/shared/icons/icon_inquiry.png';
import iconMarkB from '@/shared/icons/icon-mark_B.png';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

export default function MyPage() {
  const router = useRouter();
  const { status: authStatus } = useAuthGate(getMe);
  const handleCommonApiError = useCommonApiErrorHandler();
  const [user, setUser] = useState<UserMe | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expertStatus, setExpertStatus] = useState<ExpertStatus | null>(null);
  const [isLoadingExpertStatus, setIsLoadingExpertStatus] = useState(false);

  useEffect(() => {
    if (authStatus !== 'authed') {
      setUser(null);
      setIsLoadingUser(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingUser(true);

    (async () => {
      try {
        const data = await getUserMe();
        if (cancelled) return;
        if (!data) {
          setUser(null);
          setLoadError(null);
          return;
        }
        setUser(data);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        if (await handleCommonApiError(error)) {
          setIsLoadingUser(false);
          return;
        }
        setLoadError(error instanceof Error ? error.message : '내 정보를 불러오지 못했습니다.');
      } finally {
        if (cancelled) return;
        setIsLoadingUser(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, handleCommonApiError]);

  useEffect(() => {
    if (authStatus !== 'authed') {
      setExpertStatus(null);
      setIsLoadingExpertStatus(false);
      return;
    }
    if (!user || user.user_type !== 'EXPERT') {
      setExpertStatus(null);
      setIsLoadingExpertStatus(false);
      return;
    }

    let cancelled = false;
    setIsLoadingExpertStatus(true);

    (async () => {
      try {
        const data = await getExpertStatus();
        if (cancelled) return;
        setExpertStatus(data);
      } catch (error) {
        if (cancelled) return;
        if (await handleCommonApiError(error)) {
          setIsLoadingExpertStatus(false);
          return;
        }
        setExpertStatus(null);
      } finally {
        if (cancelled) return;
        setIsLoadingExpertStatus(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, handleCommonApiError, user]);

  const handleAuthSheetClose = () => {
    router.replace('/');
  };

  const shouldShowExpertVerifyButton =
    user?.user_type === 'EXPERT' && !expertStatus?.verified && !isLoadingExpertStatus;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <Header />

      <section className="px-4 pt-6 pb-[calc(var(--app-footer-height)+16px)]">
        {authStatus === 'checking' ? (
          <div className="mt-4 rounded-3xl bg-white px-4 py-5 shadow-sm">
            <p className="text-base text-neutral-700">불러오는 중...</p>
          </div>
        ) : authStatus !== 'authed' ? (
          <div className="mt-4 rounded-3xl bg-white px-4 py-5 shadow-sm">
            <p className="text-base text-neutral-700">로그인이 필요합니다.</p>
          </div>
        ) : isLoadingUser ? (
          <div className="mt-4 rounded-3xl bg-white px-4 py-5 shadow-sm">
            <p className="text-base text-neutral-700">내 정보를 불러오는 중...</p>
          </div>
        ) : loadError ? (
          <div className="mt-4 rounded-3xl bg-white px-4 py-5 shadow-sm">
            <p className="text-base text-red-500">{loadError}</p>
          </div>
        ) : !user ? (
          <div className="mt-4 rounded-3xl bg-white px-4 py-5 shadow-sm">
            <p className="text-base text-neutral-700">로그인이 필요합니다.</p>
          </div>
        ) : user ? (
          <div className="mt-6 flex flex-col gap-6">
            <div className="relative rounded-3xl bg-white px-4 py-6 text-center shadow-sm">
              <button
                type="button"
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#3b5bcc] text-white shadow-md"
                aria-label="프로필 수정"
                onClick={() => {
                  sessionStorage.setItem('nav-direction', 'forward');
                  router.push('/me/edit');
                }}
              >
                <svg
                  data-slot="icon"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487a2.25 2.25 0 0 1 3.182 3.182L7.5 20.213 3 21l.787-4.5L16.862 4.487Z"
                  />
                </svg>
              </button>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Image
                    src={user.profile_image_url ?? defaultUserImage}
                    alt="프로필"
                    width={112}
                    height={112}
                    unoptimized={!!user.profile_image_url}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <p className="text-lg font-semibold text-[#3b5bcc]">{user.nickname}</p>
                  {expertStatus?.verified ? (
                    <span className="rounded-full border border-[#2b4b7e] bg-[#edf4ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#2b4b7e]">
                      인증됨
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-text-caption">
                  {user.jobs[0]?.name ?? '직무 정보 없음'}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
                    {user.career_level?.level ?? '경력 정보 없음'}
                  </span>
                  {user.skills.length > 0 ? (
                    user.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]"
                      >
                        {skill.name}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
                      기술 스택 없음
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white px-4 py-5 shadow-sm">
              <p className="text-base font-semibold text-text-title">자기 소개</p>
              <p className="mt-3 text-sm text-text-body whitespace-pre-line">
                {user.introduction || '자기 소개가 없습니다.'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {shouldShowExpertVerifyButton ? (
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem('nav-direction', 'forward');
                    router.push('/me/verify');
                  }}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-center gap-3">
                    <Image src={iconCertification} alt="현직자 인증하기" width={40} height={40} />
                    <div className="text-left">
                      <span className="flex items-center gap-1 text-base font-semibold text-text-body">
                        <Image src={iconMarkB} alt="" width={18} height={18} />
                        현직자 인증하기
                      </span>
                      <p className="mt-1 text-xs text-text-caption">인증을 진행해 주세요</p>
                    </div>
                  </div>
                  <span className="text-xl text-gray-300">›</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  window.location.href = 'mailto:corp.refit@gmail.com';
                }}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-3">
                  <Image src={iconInquiry} alt="문의하기" width={40} height={40} />
                  <div className="text-left">
                    <span className="flex items-center gap-1 text-base font-semibold text-text-body">
                      <Image src={iconMarkB} alt="" width={18} height={18} />
                      문의하기
                    </span>
                    <p className="mt-1 text-xs text-text-caption">궁금한 점을 남겨 주세요</p>
                  </div>
                </div>
                <span className="text-xl text-gray-300">›</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-3xl bg-white px-4 py-5 shadow-sm">
            <p className="text-base text-neutral-700">내 정보를 불러오지 못했습니다.</p>
          </div>
        )}
      </section>

      <div className="mt-auto">
        <Footer />
      </div>

      <AuthGateSheet
        open={authStatus === 'guest'}
        title="로그인이 필요합니다"
        description="마이 페이지를 보려면 로그인해 주세요."
        onClose={handleAuthSheetClose}
      >
        <KakaoLoginButton />
      </AuthGateSheet>
    </div>
  );
}
