'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { sendEmailVerification, verifyEmailVerification } from '@/features/onboarding';
import { BusinessError, useCommonApiErrorHandler } from '@/shared/api';

const emailVerificationMessages: Record<string, string> = {
  EMAIL_FORMAT_INVALID: '이메일 형식이 올바르지 않습니다.',
  EMAIL_ALREADY_VERIFIED: '이미 인증이 완료된 이메일입니다.',
  EMAIL_VERIFICATION_RATE_LIMIT: '인증 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  VERIFICATION_CODE_INVALID: '인증번호 형식이 올바르지 않습니다.',
  VERIFICATION_CODE_MISMATCH: '인증번호가 일치하지 않습니다.',
  AUTH_UNAUTHORIZED: '인증 정보가 만료되었습니다. 다시 전송해 주세요.',
  VERIFICATION_CODE_EXPIRED: '인증 시간이 만료되었습니다. 다시 전송해 주세요.',
};

const verificationCodeLength = 6;

export function useOnboardingEmailVerification(isExpert: boolean) {
  const router = useRouter();
  const handleCommonApiError = useCommonApiErrorHandler();

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
  const [isVerificationFailSheetOpen, setIsVerificationFailSheetOpen] = useState(false);
  const [verificationExpiresAt, setVerificationExpiresAt] = useState<Date | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const handleSendVerification = () => {
    const trimmedEmail = verificationEmail.trim();
    if (!trimmedEmail) {
      setSendVerificationError('이메일을 입력해 주세요.');
      return;
    }

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
        setIsVerificationFailSheetOpen(true);
        if (await handleCommonApiError(error)) {
          return;
        }
        if (error instanceof BusinessError) {
          setSendVerificationError(
            emailVerificationMessages[error.code] ??
              error.message ??
              '인증번호 전송에 실패했습니다.',
          );
        } else if (error instanceof Error) {
          setSendVerificationError(error.message);
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

    setIsVerifying(true);
    setVerificationError(null);
    try {
      await verifyEmailVerification({ email: lastSentEmail, code });
      setIsVerified(true);
      router.replace('/');
    } catch (error: unknown) {
      if (await handleCommonApiError(error)) {
        return;
      }
      if (error instanceof BusinessError) {
        setVerificationError(
          emailVerificationMessages[error.code] ?? error.message ?? '인증번호 확인에 실패했습니다.',
        );
      } else if (error instanceof Error) {
        setVerificationError(error.message ?? '인증번호 확인에 실패했습니다.');
      } else {
        setVerificationError('인증번호 확인에 실패했습니다.');
      }
      setVerificationCode([]);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!isExpert) return;
    if (!isVerified) return;
    if (!lastSentEmail) return;
    setVerificationEmail(lastSentEmail);
  }, [isExpert, isVerified, lastSentEmail]);

  const isVerificationSubmitDisabled =
    !isVerificationVisible ||
    isVerifying ||
    isVerified ||
    verificationCode.join('').length !== verificationCodeLength ||
    !lastSentEmail ||
    (typeof remainingSeconds === 'number' && remainingSeconds === 0);

  return {
    verificationEmail,
    setVerificationEmail,
    isVerificationVisible,
    verificationCode,
    lastSentEmail,
    isSendingVerification,
    sendVerificationMessage,
    sendVerificationError,
    isVerifying,
    verificationError,
    isVerified,
    isVerificationFailSheetOpen,
    setIsVerificationFailSheetOpen,
    remainingSeconds,
    handleSendVerification,
    handleKeypadPress,
    handleVerifySubmit,
    isVerificationSubmitDisabled,
    verificationCodeLength,
  };
}
