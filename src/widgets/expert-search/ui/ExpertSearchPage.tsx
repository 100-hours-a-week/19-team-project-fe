'use client';

import type { FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { getExperts, type Expert } from '@/entities/experts';
import { useCommonApiErrorHandler } from '@/shared/api';
import defaultUserImage from '@/shared/icons/char_main.png';
import ExpertSearchHeader from './ExpertSearchHeader';

export default function ExpertSearchPage() {
  const [keyword, setKeyword] = useState('');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const handleCommonApiError = useCommonApiErrorHandler();

  const loadExperts = useCallback(
    async (nextKeyword?: string, size = 5) => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const data = await getExperts({ keyword: nextKeyword, size });
        setExperts(data.experts);
        return data;
      } catch (error) {
        if (await handleCommonApiError(error)) {
          return undefined;
        }
        setExperts([]);
        setErrorMessage('네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.');
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [handleCommonApiError],
  );

  useEffect(() => {
    if (submitted) return;
    if (!keyword.trim()) {
      setExperts([]);
      return;
    }
    const timeoutId = window.setTimeout(() => {
      loadExperts(keyword.trim() || undefined, 5);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [keyword, loadExperts, submitted]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!keyword.trim()) {
      setSubmitted(false);
      setExperts([]);
      setErrorMessage('');
      return;
    }
    setSubmitted(true);
    const data = await loadExperts(keyword.trim() || undefined, 9);
    if (data) {
      alert(JSON.stringify(data));
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <ExpertSearchHeader />
      <section className="px-6 pt-[calc(var(--app-header-height)+12px)]">
        <form onSubmit={handleSubmit}>
          <div className="flex w-full items-center justify-between gap-3 rounded-full border border-[#262627] bg-[#f7f7f7] px-4 py-3 text-left text-text-hint-main">
            <input
              type="search"
              value={keyword}
              onChange={(event) => {
                setSubmitted(false);
                setKeyword(event.target.value);
              }}
              placeholder="쌈뽕한 멘트로 수정"
              className="w-full bg-transparent text-sm text-text-body placeholder:text-text-hint-main focus:outline-none"
            />
            <button
              type="submit"
              className="text-text-hint-main transition hover:text-text-body"
              aria-label="검색"
            >
              <svg
                data-slot="icon"
                fill="none"
                strokeWidth={1.5}
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="h-5 w-5 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </button>
          </div>
        </form>

        <div className="pt-6 pb-6">
          {isLoading ? (
            <p className="text-sm text-text-hint-main">불러오는 중...</p>
          ) : errorMessage ? (
            <p className="text-sm text-red-500">{errorMessage}</p>
          ) : submitted ? (
            <div className="grid grid-cols-3 gap-4">
              {experts.map((expert) => (
                <Link
                  key={expert.user_id}
                  href={`/experts/${String(expert.user_id)}`}
                  className="flex flex-col items-center gap-3 rounded-2xl bg-white p-4 text-center shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition-transform duration-200 hover:scale-[1.01]"
                  onClick={() => {
                    sessionStorage.setItem('nav-direction', 'forward');
                  }}
                >
                  <span className="text-sm font-semibold text-text-body">{expert.nickname}</span>
                  <Image
                    src={defaultUserImage}
                    alt={`${expert.nickname} 프로필`}
                    width={72}
                    height={72}
                    className="h-[72px] w-[72px] rounded-full object-cover"
                  />
                  <span className="text-xs font-semibold text-[#111827]">자세히보기</span>
                </Link>
              ))}
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {experts.map((expert) => (
                <li
                  key={expert.user_id}
                  className="flex items-center justify-between gap-4 bg-white px-1 py-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Image
                      src={defaultUserImage}
                      alt={`${expert.nickname} 프로필`}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-sm font-semibold text-text-body">
                        {expert.nickname}
                      </span>
                      <span className="truncate text-xs text-text-caption">
                        {expert.company_name} · {expert.jobs[0]?.name ?? '직무 정보 없음'} ·{' '}
                        {expert.career_level.level}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
