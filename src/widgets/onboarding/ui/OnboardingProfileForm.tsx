'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

import { getSkills } from '@/features/onboarding/api';
import iconMark from '@/shared/icons/icon-mark.png';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

type RoleId = 'seeker' | 'expert';
type SheetId = 'job' | 'career' | 'tech' | null;

type OnboardingProfileFormProps = {
  role?: RoleId;
};

const roleTitle: Record<RoleId, string> = {
  seeker: '구직자',
  expert: '현직자',
};

const JOBS = [
  '소프트웨어 엔지니어',
  '서버 개발자',
  '웹 개발자',
  '프론트엔드 개발자',
  '자바 개발자',
  '머신러닝 엔지니어',
  '파이썬 개발자',
  'DevOps / 시스템 관리자',
];

const CAREERS = ['신입', '1~3년', '4~6년', '7~9년', '10년 이상', '리드/매니저'];

export default function OnboardingProfileForm({ role = 'seeker' }: OnboardingProfileFormProps) {
  const isExpert = role === 'expert';
  const displayRole = roleTitle[role] ?? roleTitle.seeker;
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [selectedCareer, setSelectedCareer] = useState<string>('');
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [techQuery, setTechQuery] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setSkillsLoading(true);
    setSkillsError(null);
    getSkills()
      .then((data) => {
        if (!isMounted) return;
        setSkills(data.skills.map((item) => item.name));
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setSkillsError(error instanceof Error ? error.message : '스킬 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!isMounted) return;
        setSkillsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTech = useMemo(() => {
    const query = techQuery.trim().toLowerCase();
    if (!query) return skills;
    return skills.filter((item) => item.toLowerCase().includes(query));
  }, [skills, techQuery]);

  const toggleTech = (value: string) => {
    setSelectedTech((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  return (
    <main className="flex min-h-screen flex-col bg-white px-6 pb-10 pt-12 text-text-body">
      <header className="relative">
        <button
          type="button"
          className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl text-text-caption"
          aria-label="뒤로가기"
        >
          ←
        </button>
        <div className="mx-auto max-w-xs text-center">
          <Image src={iconMark} alt="re-fit" width={36} height={36} priority />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.25em] text-text-caption">
            onboarding
          </p>
        </div>
      </header>

      <section className="mt-10 flex flex-1 flex-col gap-6">
        <div>
          <p className="text-2xl font-semibold text-text-title">환영합니다!</p>
          <p className="mt-2 text-sm text-text-caption">선택한 유형: {displayRole}</p>
        </div>

        {isExpert ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-title">이메일 인증</p>
                <p className="mt-1 text-xs text-text-caption">
                  현직자 전용 인증을 완료하면 프로필이 활성화됩니다.
                </p>
              </div>
              <div className="h-10 w-20 rounded-md bg-gray-200" aria-hidden="true" />
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-sm text-text-caption">
            <span>닉네임</span>
            <span>0 / 15</span>
          </div>
          <Input.Root className="mt-2">
            <Input.Field placeholder="닉네임을 입력해 주세요" />
          </Input.Root>
          <div className="mt-2 flex items-center justify-between text-xs text-red-500">
            <span>이미 사용중인 닉네임입니다</span>
            <button type="button" className="h-6 w-6 rounded-full bg-gray-200 text-gray-500">
              ×
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setActiveSheet('job')}
            className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-200" aria-hidden="true" />
              <div className="text-left">
                <span className="text-base font-semibold text-text-body">직무</span>
                <p className="mt-1 text-xs text-text-caption">
                  {selectedJob || '직무를 선택해 주세요'}
                </p>
              </div>
            </div>
            <span className="text-xl text-gray-300">›</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSheet('career')}
            className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-200" aria-hidden="true" />
              <div className="text-left">
                <span className="text-base font-semibold text-text-body">경력</span>
                <p className="mt-1 text-xs text-text-caption">
                  {selectedCareer || '경력을 선택해 주세요'}
                </p>
              </div>
            </div>
            <span className="text-xl text-gray-300">›</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSheet('tech')}
            className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-200" aria-hidden="true" />
              <div className="text-left">
                <span className="text-base font-semibold text-text-body">기술스택</span>
                <p className="mt-1 text-xs text-text-caption">
                  {selectedTech.length ? selectedTech.join(', ') : '기술을 선택해 주세요'}
                </p>
              </div>
            </div>
            <span className="text-xl text-gray-300">›</span>
          </button>
        </div>

        <div>
          <p className="text-base font-semibold text-text-title">자기 소개</p>
          <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <textarea
              className="h-28 w-full resize-none text-sm text-text-body placeholder:text-gray-400 focus:outline-none"
              placeholder="Tell us everything..."
            />
            <p className="mt-2 text-right text-xs text-text-caption">0/300</p>
          </div>
        </div>
      </section>

      <div className="pt-6">
        <Button icon={<Image src={iconMark} alt="" width={20} height={20} />}>가입 완료</Button>
      </div>

      <BottomSheet
        open={activeSheet !== null}
        title={
          activeSheet === 'job' ? '직무 선택' : activeSheet === 'career' ? '경력 선택' : '기술스택'
        }
        onClose={() => setActiveSheet(null)}
      >
        {activeSheet === 'tech' ? (
          <div>
            <div className="flex items-center gap-2 rounded-full bg-[#edf4ff] px-4 py-3">
              <span className="text-sm text-text-caption">🔍</span>
              <input
                value={techQuery}
                onChange={(event) => setTechQuery(event.target.value)}
                className="w-full bg-transparent text-sm text-text-body outline-none"
                placeholder="기술을 검색해 보세요"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedTech.map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => toggleTech(tech)}
                  className="rounded-full border border-[#bcd1f5] bg-[#edf4ff] px-3 py-1 text-xs text-[#2b4b7e]"
                >
                  {tech} ×
                </button>
              ))}
            </div>
            <div className="mt-6 flex max-h-[36vh] flex-col gap-3 overflow-y-auto pr-1">
              {skillsLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
              {skillsError ? <p className="text-sm text-red-500">{skillsError}</p> : null}
              {!skillsLoading && !skillsError
                ? filteredTech.map((item) => {
                    const isSelected = selectedTech.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleTech(item)}
                        className="flex items-center justify-between border-b border-gray-100 pb-3 text-left"
                      >
                        <span className="text-sm font-medium text-text-body">{item}</span>
                        <span
                          className={`h-5 w-5 rounded-full border ${
                            isSelected ? 'border-[#2b4b7e] bg-[#2b4b7e]' : 'border-gray-300'
                          }`}
                        />
                      </button>
                    );
                  })
                : null}
            </div>
          </div>
        ) : null}

        {activeSheet === 'job' ? (
          <div className="flex max-h-[46vh] flex-col gap-4 overflow-y-auto pr-1">
            {JOBS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSelectedJob(item)}
                className="flex items-center justify-between text-left"
              >
                <span className="text-sm font-medium text-text-body">{item}</span>
                <span
                  className={`h-5 w-5 rounded-md border ${
                    selectedJob === item ? 'border-[#2b4b7e] bg-[#2b4b7e]' : 'border-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        ) : null}

        {activeSheet === 'career' ? (
          <div className="flex max-h-[46vh] flex-col gap-4 overflow-y-auto pr-1">
            {CAREERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSelectedCareer(item)}
                className="flex items-center justify-between text-left"
              >
                <span className="text-sm font-medium text-text-body">{item}</span>
                <span
                  className={`h-5 w-5 rounded-md border ${
                    selectedCareer === item ? 'border-[#2b4b7e] bg-[#2b4b7e]' : 'border-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        ) : null}
      </BottomSheet>
    </main>
  );
}
