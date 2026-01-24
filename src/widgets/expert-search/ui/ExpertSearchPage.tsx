'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { getExperts, type Expert } from '@/entities/experts';
import { ProfileCard } from '@/shared/ui/profile-card';

export default function ExpertSearchPage() {
  const [keyword, setKeyword] = useState('');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadExperts = useCallback(async (nextKeyword?: string, size = 5) => {
    setIsLoading(true);
    try {
      const data = await getExperts({ keyword: nextKeyword, size });
      setExperts(data.experts);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExperts(undefined, 5);
  }, [loadExperts]);

  useEffect(() => {
    if (submitted) return;
    const timeoutId = window.setTimeout(() => {
      loadExperts(keyword.trim() || undefined, 5);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [keyword, loadExperts, submitted]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    await loadExperts(keyword.trim() || undefined, 9);
  };

  return (
    <section className="px-6 pt-4">
      <form onSubmit={handleSubmit}>
        <div className="flex w-full items-center justify-between gap-3 rounded-full border border-[#262627] bg-[#f7f7f7] px-4 py-3 text-left text-text-hint-main">
          <input
            type="search"
            value={keyword}
            onChange={(event) => {
              setSubmitted(false);
              setKeyword(event.target.value);
            }}
            placeholder="커피챗 하고 싶은 현직자 탐색!!"
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

      <div className="pt-6">
        {isLoading ? (
          <p className="text-sm text-text-hint-main">불러오는 중...</p>
        ) : submitted ? (
          <div className="grid grid-cols-3 gap-4">
            {experts.map((expert) => (
              <ProfileCard
                key={expert.user_id}
                name={expert.nickname}
                title={`${expert.company_name} · ${expert.jobs[0]?.name ?? '직무 정보 없음'}`}
                subtitle={`${expert.career_level.level} · ${expert.skills[0]?.name ?? '스킬 정보 없음'}`}
                enableTilt
                enableMobileTilt={false}
                showAvatarPlaceholder
                cardHeight="190px"
                maxHeight="200px"
                className="w-full"
              />
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {experts.map((expert) => (
              <li
                key={expert.user_id}
                className="flex items-center justify-between gap-4 rounded-xl border border-[#e5e5e5] bg-white px-4 py-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-[#ff3b30]" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm font-semibold text-text-body">
                      {expert.nickname}
                    </span>
                    <span className="truncate text-xs text-text-caption">
                      {expert.company_name} · {expert.jobs[0]?.name ?? '직무 정보 없음'} ·{' '}
                      {expert.career_level.level}
                    </span>
                    <span className="truncate text-[11px] text-text-hint-main">
                      평균 {expert.rating_avg.toFixed(1)}점 · {expert.rating_count}건 ·{' '}
                      {expert.skills[0]?.name ?? '스킬 정보 없음'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
