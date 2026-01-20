'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

import { getCareerLevels, getJobs, getSkills } from '@/features/onboarding/api';
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

export default function OnboardingProfileForm({ role = 'seeker' }: OnboardingProfileFormProps) {
  const isExpert = role === 'expert';
  const displayRole = roleTitle[role] ?? roleTitle.seeker;
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [selectedCareer, setSelectedCareer] = useState<string>('');
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [techQuery, setTechQuery] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<string[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [careerLevels, setCareerLevels] = useState<string[]>([]);
  const [careerLoading, setCareerLoading] = useState(true);
  const [careerError, setCareerError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
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

  useEffect(() => {
    let isMounted = true;
    getJobs()
      .then((data) => {
        if (!isMounted) return;
        setJobs(data.jobs.map((item) => item.name));
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setJobsError(error instanceof Error ? error.message : '직무 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!isMounted) return;
        setJobsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    getCareerLevels()
      .then((data) => {
        if (!isMounted) return;
        setCareerLevels(data.career_levels.map((item) => item.level));
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setCareerError(error instanceof Error ? error.message : '경력 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!isMounted) return;
        setCareerLoading(false);
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
    setSelectedTech((prev) => {
      if (prev.includes(value)) return prev.filter((item) => item !== value);
      if (prev.length >= 5) return prev;
      return [...prev, value];
    });
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
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              {selectedJob ? (
                <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
                  {selectedJob}
                </span>
              ) : null}
              <span className="text-xl text-gray-300">›</span>
            </div>
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
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              {selectedCareer ? (
                <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
                  {selectedCareer}
                </span>
              ) : null}
              <span className="text-xl text-gray-300">›</span>
            </div>
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
                <p className="mt-1 text-xs text-text-caption">기술을 선택해 주세요</p>
              </div>
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              {selectedTech.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]"
                >
                  {tech}
                </span>
              ))}
              <span className="text-xl text-gray-300">›</span>
            </div>
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
            {jobsLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
            {jobsError ? <p className="text-sm text-red-500">{jobsError}</p> : null}
            {!jobsLoading && !jobsError
              ? jobs.map((item) => (
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
                ))
              : null}
          </div>
        ) : null}

        {activeSheet === 'career' ? (
          <div className="flex max-h-[46vh] flex-col gap-4 overflow-y-auto pr-1">
            {careerLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
            {careerError ? <p className="text-sm text-red-500">{careerError}</p> : null}
            {!careerLoading && !careerError
              ? careerLevels.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSelectedCareer(item)}
                    className="flex items-center justify-between text-left"
                  >
                    <span className="text-sm font-medium text-text-body">{item}</span>
                    <span
                      className={`h-5 w-5 rounded-md border ${
                        selectedCareer === item
                          ? 'border-[#2b4b7e] bg-[#2b4b7e]'
                          : 'border-gray-300'
                      }`}
                    />
                  </button>
                ))
              : null}
          </div>
        ) : null}
      </BottomSheet>
    </main>
  );
}
