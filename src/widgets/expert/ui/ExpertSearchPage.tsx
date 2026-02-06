'use client';

import type { FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getExperts, type Expert } from '@/entities/experts';
import { useCommonApiErrorHandler } from '@/shared/api';
import defaultUserImage from '@/shared/icons/char_icon.png';
import ExpertSearchHeader from './ExpertSearchHeader';

export default function ExpertSearchPage() {
  const [keyword, setKeyword] = useState('');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [flowSlide, setFlowSlide] = useState(0);
  const handleCommonApiError = useCommonApiErrorHandler();
  const router = useRouter();

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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setFlowSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!keyword.trim()) {
      setSubmitted(false);
      setExperts([]);
      setErrorMessage('');
      return;
    }
    setSubmitted(true);
    await loadExperts(keyword.trim() || undefined, 9);
  };

  return (
    <div className="min-h-screen bg-white">
      <ExpertSearchHeader />
      <section className="px-4 pt-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
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
        <form onSubmit={handleSubmit} className="mt-5">
          <div className="flex w-full items-center justify-between gap-3 rounded-full border border-[#262627] bg-[#f7f7f7] px-4 py-3 text-left text-text-hint-main">
            <input
              type="search"
              value={keyword}
              onChange={(event) => {
                setSubmitted(false);
                setKeyword(event.target.value);
              }}
              placeholder="나에게 Fit한 현직자를 찾아보세요"
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
        {!submitted && experts.length === 0 && !isLoading && !errorMessage ? (
          <div className="mt-5 text-[12px] text-text-body">
            <div className="relative overflow-hidden rounded-2xl">
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${flowSlide * 100}%)` }}
              >
                <div className="w-full shrink-0 space-y-4">
                  <div className="rounded-2xl border border-[#e5e7eb] bg-white/80 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#edf4ff] text-[11px] font-semibold text-[#2b4b7e]">
                        1
                      </span>
                      <p className="text-[13px] font-semibold text-text-title">현직자 검색</p>
                    </div>
                    <p className="mt-2 text-[12px] text-text-caption">
                      아래 조건을 활용해 현직자를 검색할 수 있습니다.
                    </p>
                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="font-semibold">현직자 이름 검색</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-text-caption">예:</span>
                          <span className="rounded-full border border-[#2b4b7e] bg-[#edf4ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#2b4b7e]">
                            홍길동
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold">기술 스택 검색</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-text-caption">예:</span>
                          <span className="rounded-full border border-[#2b4b7e] bg-[#edf4ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#2b4b7e]">
                            Java
                          </span>
                          <span className="rounded-full border border-[#2b4b7e] bg-[#edf4ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#2b4b7e]">
                            JavaScript
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold">직무 검색</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-text-caption">예:</span>
                          <span className="rounded-full border border-[#2b4b7e] bg-[#edf4ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#2b4b7e]">
                            백엔드
                          </span>
                          <span className="rounded-full border border-[#2b4b7e] bg-[#edf4ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#2b4b7e]">
                            프론트엔드
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-text-caption">※ 복수 조건 동시 검색 가능</p>
                    </div>
                  </div>
                </div>

                <div className="w-full shrink-0 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#edf4ff] text-[11px] font-semibold text-[#2b4b7e]">
                          2
                        </span>
                        <p className="text-[13px] font-semibold text-text-title">검색 실행</p>
                      </div>
                      <p className="mt-2 text-[12px] text-text-caption">
                        <span className="font-semibold text-text-body">[검색] 버튼</span>을 클릭하여
                        조건에 맞는 현직자를 조회합니다.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#edf4ff] text-[11px] font-semibold text-[#2b4b7e]">
                          3
                        </span>
                        <p className="text-[13px] font-semibold text-text-title">
                          현직자 리스트 확인
                        </p>
                      </div>
                      <p className="mt-2 text-[12px] text-text-caption">
                        검색 조건에 맞는 현직자 목록이 노출되며, 주요 정보(직무, 경력, 기술 스택
                        등)를 확인할 수 있습니다.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#edf4ff] text-[11px] font-semibold text-[#2b4b7e]">
                        4
                      </span>
                      <p className="text-[13px] font-semibold text-text-title">현직자 상세 보기</p>
                    </div>
                    <p className="mt-2 text-[12px] text-text-caption">
                      관심 있는 현직자를 선택하여 상세 페이지로 이동하고, 경력/직무 정보/커피챗 가능
                      여부를 확인할 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className="w-full shrink-0 space-y-3">
                  <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#edf4ff] text-[11px] font-semibold text-[#2b4b7e]">
                        5
                      </span>
                      <p className="text-[13px] font-semibold text-text-title">자료 첨부 (선택)</p>
                    </div>
                    <p className="mt-2 text-[12px] text-text-caption">
                      채팅 요청 전, 필요 시 아래 자료를 첨부할 수 있습니다.
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-text-caption">예:</span>
                      <span className="rounded-full border border-[#2b4b7e] bg-[#edf4ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#2b4b7e]">
                        이력서
                      </span>
                      <span className="rounded-full border border-[#2b4b7e] bg-[#edf4ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#2b4b7e]">
                        지원 공고 링크
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-text-caption">
                      ※ 첨부 자료는 보다 구체적인 피드백을 위해 활용됩니다.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#edf4ff] text-[11px] font-semibold text-[#2b4b7e]">
                        6
                      </span>
                      <p className="text-[13px] font-semibold text-text-title">채팅 요청</p>
                    </div>
                    <p className="mt-2 text-[12px] text-text-caption">
                      <span className="font-semibold text-text-body">[채팅 요청하기] 버튼</span>을
                      클릭하여 현직자에게 커피챗을 요청합니다. 요청 완료 후, 현직자의 수락 시 채팅이
                      시작됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-text-caption">
              <button
                type="button"
                onClick={() => setFlowSlide((prev) => Math.max(prev - 1, 0))}
                className="rounded-full border border-[#e5e7eb] bg-white px-3 py-1 disabled:opacity-40"
                disabled={flowSlide === 0}
              >
                이전
              </button>
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`슬라이드 ${index + 1}`}
                    onClick={() => setFlowSlide(index)}
                    className={`h-2 w-2 rounded-full transition ${
                      flowSlide === index ? 'bg-[#2b4b7e]' : 'bg-[#e5e7eb]'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setFlowSlide((prev) => Math.min(prev + 1, 2))}
                className="rounded-full border border-[#e5e7eb] bg-white px-3 py-1 disabled:opacity-40"
                disabled={flowSlide === 2}
              >
                다음
              </button>
            </div>
          </div>
        ) : null}

        <div className="pt-6 pb-6">
          {isLoading ? (
            <p className="text-sm text-text-hint-main">불러오는 중...</p>
          ) : errorMessage ? (
            <p className="text-sm text-red-500">{errorMessage}</p>
          ) : submitted ? (
            experts.length === 0 ? (
              <p className="text-center text-sm text-text-hint-main">검색 결과가 없습니다.</p>
            ) : (
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
                      src={expert.profile_image_url || defaultUserImage}
                      alt={`${expert.nickname} 프로필`}
                      width={72}
                      height={72}
                      unoptimized={!!expert.profile_image_url}
                      className="h-[72px] w-[72px] rounded-full object-cover"
                    />
                    <span className="text-xs font-semibold text-[#111827]">자세히보기</span>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <ul className="flex flex-col gap-3">
              {experts.map((expert) => (
                <li
                  key={expert.user_id}
                  className="flex items-center justify-between gap-4 bg-white px-1 py-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Image
                      src={expert.profile_image_url || defaultUserImage}
                      alt={`${expert.nickname} 프로필`}
                      width={40}
                      height={40}
                      unoptimized={!!expert.profile_image_url}
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
