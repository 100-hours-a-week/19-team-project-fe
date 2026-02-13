'use client';

import { useEffect, useRef, useState } from 'react';

export function useOnboardingOauthInfo({
  nickname,
  setNickname,
}: {
  nickname: string;
  setNickname: (value: string) => void;
}) {
  const [oauthId, setOauthId] = useState<string | null>(null);
  const [oauthEmail, setOauthEmail] = useState<string | null>(null);
  const didPrefill = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem('kakaoLoginResult');
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        signup_required?: {
          oauth_provider?: 'KAKAO';
          oauth_id?: string;
          email?: string | null;
          nickname?: string | null;
        } | null;
      };
      const signupRequired = parsed.signup_required;
      if (!signupRequired?.oauth_id) return;
      setOauthId(signupRequired.oauth_id);
      if (signupRequired.email) setOauthEmail(signupRequired.email);
      if (!didPrefill.current && signupRequired.nickname && nickname.trim().length === 0) {
        setNickname(signupRequired.nickname);
      }
      didPrefill.current = true;
    } catch {
      // ignore invalid session storage
    }
  }, [nickname, setNickname]);

  return { oauthId, oauthEmail };
}
