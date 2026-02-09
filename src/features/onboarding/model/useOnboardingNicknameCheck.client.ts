'use client';

import { useState } from 'react';

import { checkNickname } from '@/features/onboarding';
import { BusinessError, useCommonApiErrorHandler } from '@/shared/api';

const nicknameValidationMessages: Record<string, string> = {
  NICKNAME_EMPTY: '닉네임을 입력해 주세요.',
  NICKNAME_TOO_SHORT: '닉네임이 너무 짧아요.',
  NICKNAME_TOO_LONG: '닉네임이 너무 길어요.',
  NICKNAME_INVALID_CHARACTERS: '특수 문자/이모지는 사용할 수 없어요.',
  NICKNAME_CONTAINS_WHITESPACE: '닉네임에 공백을 포함할 수 없어요.',
};

export function useOnboardingNicknameCheck(nicknameLimit: number) {
  const handleCommonApiError = useCommonApiErrorHandler();
  const [nicknameCheckMessage, setNicknameCheckMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isNicknameChecking, setIsNicknameChecking] = useState(false);
  const [checkedNickname, setCheckedNickname] = useState<string | null>(null);

  const handleNicknameCheck = async (nickname: string) => {
    if (isNicknameChecking) return;
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameCheckMessage({ tone: 'error', text: '닉네임을 입력해 주세요.' });
      return;
    }
    if (trimmed.length > nicknameLimit) {
      setNicknameCheckMessage({ tone: 'error', text: '닉네임이 너무 길어요.' });
      return;
    }

    setIsNicknameChecking(true);
    setNicknameCheckMessage(null);
    try {
      await checkNickname(trimmed);
      setCheckedNickname(trimmed);
      setNicknameCheckMessage({ tone: 'success', text: '사용 가능한 닉네임이에요.' });
    } catch (error) {
      if (await handleCommonApiError(error)) return;
      if (error instanceof BusinessError) {
        setNicknameCheckMessage({
          tone: 'error',
          text: nicknameValidationMessages[error.code] ?? '닉네임 확인에 실패했습니다.',
        });
      } else if (error instanceof Error) {
        setNicknameCheckMessage({ tone: 'error', text: error.message });
      } else {
        setNicknameCheckMessage({ tone: 'error', text: '닉네임 확인에 실패했습니다.' });
      }
    } finally {
      setIsNicknameChecking(false);
    }
  };

  return {
    nicknameCheckMessage,
    isNicknameChecking,
    checkedNickname,
    handleNicknameCheck,
  };
}
