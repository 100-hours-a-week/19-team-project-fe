'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getMe } from '@/features/auth';
import { sendEmailVerification, verifyEmailVerification } from '@/features/email-verification';
import { useAuthGate } from '@/shared/lib/useAuthGate';
import { useCommonApiErrorHandler } from '@/shared/api';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { useToast } from '@/shared/ui/toast';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

const verificationCodeLength = 6;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailVerificationMessages: Record<string, string> = {
  EMAIL_FORMAT_INVALID: '이메일 형식이 올바르지 않습니다.',
  EMAIL_VERIFICATION_RATE_LIMIT: '인증 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  VERIFICATION_CODE_INVALID: '인증번호 형식이 올바르지 않습니다.',
  AUTH_UNAUTHORIZED: '인증 정보가 만료되었습니다. 다시 전송해 주세요.',
  VERIFICATION_CODE_EXPIRED: '인증 시간이 만료되었습니다. 다시 전송해 주세요.',
};

const getErrorCode = (error: Error) =>
  'code' in error ? String((error as { code?: string }).code ?? '') : error.message;

export default function MyPageVerify() {
  const router = useRouter();
  const { status: authStatus } = useAuthGate(getMe);
  const handleCommonApiError = useCommonApiErrorHandler();
  const { pushToast } = useToast();

  const [verificationEmail, setVerificationEmail] = useState('');
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string[]>([]);
  const [lastSentEmail, setLastSentEmail] = useState<string | null>(null);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [sendVerificationMessage, setSendVerificationMessage] = useState<string | null>(null);
  const [sendVerificationError, setSendVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationExpiresAt, setVerificationExpiresAt] = useState<Date | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (authStatus === 'guest') {
      router.replace('/me');
    }
  }, [authStatus, router]);

  const handleSendVerification = () => {
    const trimmedEmail = verificationEmail.trim();
    if (!trimmedEmail) {
      setSendVerificationError('이메일을 입력해 주세요.');
      return;
    }
    if (!emailPattern.test(trimmedEmail)) {
      setSendVerificationError(emailVerificationMessages.EMAIL_FORMAT_INVALID);
      return;
    }
    if (isSendingVerification) return;

    setIsSendingVerification(true);
    setSendVerificationError(null);
    setSendVerificationMessage(null);
    setVerificationError(null);
    setIsVerified(false);
    sendEmailVerification({ email: trimmedEmail })
      .then((data) => {
        setLastSentEmail(trimmedEmail);
        if (data.expires_at) {
          const expiresAt = new Date(data.expires_at);
          setVerificationExpiresAt(expiresAt);
          setRemainingSeconds(Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)));
        } else {
          setVerificationExpiresAt(null);
          setRemainingSeconds(null);
        }
        setIsVerificationVisible(true);
        setSendVerificationMessage('인증번호를 전송했습니다.');
      })
      .catch(async (error: unknown) => {
        if (await handleCommonApiError(error)) {
          return;
        }
        if (error instanceof Error) {
          const errorCode = getErrorCode(error);
          setSendVerificationError(
            emailVerificationMessages[errorCode] ??
              error.message ??
              '인증번호 전송에 실패했습니다.',
          );
        } else {
          setSendVerificationError('인증번호 전송에 실패했습니다.');
        }
      })
      .finally(() => {
        setIsSendingVerification(false);
      });
  };

  const handleKeypadPress = (value: string) => {
    setVerificationCode((prev) => {
      if (value === 'backspace') {
        return prev.slice(0, -1);
      }
      if (prev.length >= verificationCodeLength) return prev;
      return [...prev, value];
    });
  };

  useEffect(() => {
    if (!lastSentEmail) return;
    if (verificationEmail.trim() === lastSentEmail) return;
    setVerificationCode([]);
    setIsVerified(false);
    setVerificationError(null);
    setIsVerificationVisible(false);
    setVerificationExpiresAt(null);
    setRemainingSeconds(null);
  }, [lastSentEmail, verificationEmail]);

  useEffect(() => {
    if (!verificationExpiresAt || !isVerificationVisible) {
      return;
    }

    const tick = () => {
      const secondsLeft = Math.max(
        0,
        Math.floor((verificationExpiresAt.getTime() - Date.now()) / 1000),
      );
      setRemainingSeconds(secondsLeft);
      if (secondsLeft === 0) {
        setVerificationError('인증 시간이 만료되었습니다. 다시 전송해 주세요.');
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [verificationExpiresAt, isVerificationVisible]);

  const handleVerifySubmit = async () => {
    const code = verificationCode.join('');
    if (!isVerificationVisible || isVerifying || isVerified) return;
    if (code.length !== verificationCodeLength) return;
    if (!lastSentEmail) return;
    if (typeof remainingSeconds === 'number' && remainingSeconds === 0) {
      setVerificationError('인증 시간이 만료되었습니다. 다시 전송해 주세요.');
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setVerificationError('네트워크 오류가 발생했어요. 다시 시도해 주세요.');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    try {
      await verifyEmailVerification({ email: lastSentEmail, code });
      setIsVerified(true);
      pushToast('인증 성공', { variant: 'success' });
      router.replace('/me');
    } catch (error: unknown) {
      if (await handleCommonApiError(error)) {
        return;
      }
      if (error instanceof Error) {
        const errorCode = getErrorCode(error);
        setVerificationError(
          emailVerificationMessages[errorCode] ?? error.message ?? '인증번호 확인에 실패했습니다.',
        );
      } else {
        setVerificationError('인증번호 확인에 실패했습니다.');
      }
      setVerificationCode([]);
    } finally {
      setIsVerifying(false);
    }
  };

  const isVerificationSubmitDisabled =
    !isVerificationVisible ||
    isVerifying ||
    isVerified ||
    verificationCode.join('').length !== verificationCodeLength ||
    !lastSentEmail ||
    (typeof remainingSeconds === 'number' && remainingSeconds === 0);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <Header />

      <section className="px-2.5 pt-6 pb-[calc(var(--app-footer-height)+16px)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('nav-direction', 'back');
              router.back();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm"
            aria-label="뒤로 가기"
          >
            <svg
              data-slot="icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-title">이메일 인증</p>
            </div>
          </div>
          <Input.Root className="mt-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input.Field
                  placeholder="이메일을 입력해 주세요"
                  value={verificationEmail}
                  onChange={(event) => setVerificationEmail(event.target.value)}
                  className="rounded-none border-0 border-b-2 border-b-[var(--color-primary-main)] bg-transparent px-0 py-2 pr-14 text-sm text-text-body shadow-none focus:border-b-[var(--color-primary-main)] focus:ring-0"
                />
              </div>
              <button
                type="button"
                onClick={handleSendVerification}
                disabled={isSendingVerification || verificationEmail.trim().length === 0}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 text-neutral-400 enabled:border-[var(--color-primary-main)] enabled:bg-[var(--color-primary-main)] enabled:text-white"
              >
                <svg
                  data-slot="icon"
                  fill="none"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </button>
            </div>
            {sendVerificationMessage ? (
              <p className="mt-2 text-xs text-[#2b4b7e]">{sendVerificationMessage}</p>
            ) : null}
            {sendVerificationError ? (
              <p className="mt-2 text-xs text-red-500">{sendVerificationError}</p>
            ) : null}
          </Input.Root>
          <div className="mt-6 min-h-[360px]">
            <div
              className={`transition-all duration-300 ${
                isVerificationVisible
                  ? 'opacity-100 translate-y-0'
                  : 'pointer-events-none opacity-0 -translate-y-2'
              }`}
            >
              <div className="text-center">
                <p className="text-sm font-semibold text-text-title">
                  인증번호 6자리를 입력해 주세요
                </p>
                {typeof remainingSeconds === 'number' ? (
                  <p className="mt-2 text-xs text-text-caption">
                    남은 시간 {Math.floor(remainingSeconds / 60)}:
                    {String(remainingSeconds % 60).padStart(2, '0')}
                  </p>
                ) : null}
                {isVerifying ? (
                  <p className="mt-2 text-xs text-text-caption">인증 확인 중...</p>
                ) : null}
                {isVerified ? <p className="mt-2 text-xs text-[#2b4b7e]">인증 완료</p> : null}
                {verificationError ? (
                  <p className="mt-2 text-xs text-red-500">{verificationError}</p>
                ) : null}
                <div className="mt-4 flex items-center justify-center gap-3">
                  {Array.from({ length: verificationCodeLength }).map((_, index) => {
                    const isFilled = verificationCode[index] !== undefined;
                    return (
                      <span
                        key={`code-dot-${index}`}
                        className={`h-3 w-3 rounded-full border ${
                          isFilled
                            ? 'border-[#2b4b7e] bg-[#2b4b7e]'
                            : 'border-[#bcd1f5] bg-[#edf4ff]'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-6 px-2.5 text-center text-2xl font-semibold text-[#2b4b7e]">
                {['3', '7', '0', '6', '8', '2', '4', '1', '5', 'biometric', '9', 'backspace'].map(
                  (item) => {
                    if (item === 'biometric') {
                      return (
                        <button
                          key="biometric"
                          type="button"
                          aria-hidden="true"
                          className="flex h-16 items-center justify-center text-gray-300"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            className="h-6 w-6"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M7 4h2m6 0h2M4 7v2m0 6v2m16-8v2m0 6v2M8 8h8v8H8z"
                            />
                          </svg>
                        </button>
                      );
                    }

                    if (item === 'backspace') {
                      return (
                        <button
                          key="backspace"
                          type="button"
                          onClick={() => handleKeypadPress('backspace')}
                          className="flex h-16 items-center justify-center text-[#2b4b7e]"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            className="h-6 w-6"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10 6h8a2 2 0 012 2v8a2 2 0 01-2 2h-8l-4-6 4-6z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13 10l4 4m0-4l-4 4"
                            />
                          </svg>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleKeypadPress(item)}
                        className="flex h-16 items-center justify-center"
                      >
                        {item}
                      </button>
                    );
                  },
                )}
              </div>
              <div className="mt-3 flex justify-center">
                <div className="w-full max-w-xs">
                  <Button
                    type="button"
                    onClick={handleVerifySubmit}
                    disabled={isVerificationSubmitDisabled}
                  >
                    제출
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
