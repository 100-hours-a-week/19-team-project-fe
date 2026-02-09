'use client';

import { useState } from 'react';

import { checkNickname } from '@/features/onboarding';
import { useCommonApiErrorHandler } from '@/shared/api';

const nicknameValidationMessages: Record<string, string> = {
  NICKNAME_EMPTY: '닉네임을 입력해 주세요.',
  NICKNAME_TOO_SHORT: '닉네임이 너무 짧아요.',
  NICKNAME_TOO_LONG: '닉네임이 너무 길어요.',
  NICKNAME_INVALID_CHARACTERS: '특수 문자/이모지는 사용할 수 없어요.',
  NICKNAME_CONTAINS_WHITESPACE: '닉네임에 공백을 포함할 수 없어요.',
  NICKNAME_DUPLICATE: '이미 사용 중인 닉네임입니다.',
};

export function useMyPageEditNicknameCheck(nicknameLimit: number) {
  const handleCommonApiError = useCommonApiErrorHandler();
  const [checkedNickname, setCheckedNickname] = useState<string | null>(null);
  const [nicknameCheckMessage, setNicknameCheckMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isNicknameChecking, setIsNicknameChecking] = useState(false);

  const handleNicknameCheck = async (nickname: string, initialNickname: string) => {
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
    if (trimmed === initialNickname) {
      setNicknameCheckMessage({ tone: 'success', text: '현재 닉네임이에요.' });
      return;
    }

    setIsNicknameChecking(true);
    setNicknameCheckMessage(null);
    try {
      await checkNickname(trimmed);
      setCheckedNickname(trimmed);
      setNicknameCheckMessage({ tone: 'success', text: '사용 가능한 닉네임이에요.' });
    } catch (error: unknown) {
      if (await handleCommonApiError(error)) return;
      if (error instanceof Error) {
        const errorCode = 'code' in error ? String((error as { code?: string }).code ?? '') : '';
        setNicknameCheckMessage({
          tone: 'error',
          text: nicknameValidationMessages[errorCode] ?? '닉네임 확인에 실패했습니다.',
        });
      } else {
        setNicknameCheckMessage({ tone: 'error', text: '닉네임 확인에 실패했습니다.' });
      }
    } finally {
      setIsNicknameChecking(false);
    }
  };

  return {
    checkedNickname,
    nicknameCheckMessage,
    isNicknameChecking,
    handleNicknameCheck,
  };
}
