'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import type { CareerLevel, Job, Skill } from '@/entities/onboarding';
import { signup } from '@/features/auth/signup/api';
import { getCareerLevels, getJobs, getSkills } from '@/features/onboarding/api';
import iconMark from '@/shared/icons/icon-mark.png';
import iconMarkB from '@/shared/icons/icon-mark_B.png';
import iconCareer from '@/shared/icons/icon_career.png';
import iconJob from '@/shared/icons/Icon_job.png';
import iconTech from '@/shared/icons/Icon_tech.png';
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

export default function OnboardingProfileForm({ role }: OnboardingProfileFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role')?.toLowerCase();
  const resolvedRole: RoleId =
    roleParam === 'expert' || roleParam === 'seeker' ? roleParam : (role ?? 'seeker');
  const isExpert = resolvedRole === 'expert';
  const displayRole = roleTitle[resolvedRole] ?? roleTitle.seeker;
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerLevel | null>(null);
  const [selectedTech, setSelectedTech] = useState<Skill[]>([]);
  const [techQuery, setTechQuery] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [careerLevels, setCareerLevels] = useState<CareerLevel[]>([]);
  const [careerLoading, setCareerLoading] = useState(true);
  const [careerError, setCareerError] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getSkills()
      .then((data) => {
        if (!isMounted) return;
        setSkills(data.skills);
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
        setJobs(data.jobs);
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
        setCareerLevels(data.career_levels);
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
    return skills.filter((item) => item.name.toLowerCase().includes(query));
  }, [skills, techQuery]);

  const toggleTech = (value: Skill) => {
    setSelectedTech((prev) => {
      if (prev.some((item) => item.id === value.id)) {
        return prev.filter((item) => item.id !== value.id);
      }
      if (prev.length >= 5) return prev;
      return [...prev, value];
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!selectedJob || !selectedCareer || selectedTech.length === 0) return;

    const raw = sessionStorage.getItem('kakaoLoginResult');
    if (!raw) return;

    let oauthId = '';
    const email = '';
    let fallbackNickname = '';

    try {
      const parsed = JSON.parse(raw) as {
        signupRequired?: {
          provider?: string;
          providerUserId?: string;
          email?: string | null;
          nickname?: string | null;
        };
      };
      const signupRequired = parsed.signupRequired;
      if (signupRequired) {
        oauthId = signupRequired.providerUserId ?? '';
        fallbackNickname = signupRequired.nickname ?? '';
      }
    } catch {
      return;
    }

    const resolvedNickname = nickname.trim() || fallbackNickname;
    if (!oauthId || !resolvedNickname) return;

    setIsSubmitting(true);
    try {
      await signup({
        oauth_provider: 'KAKAO',
        oauth_id: oauthId,
        email,
        nickname: resolvedNickname,
        user_type: 'JOB_SEEKER',
        career_level_id: selectedCareer.id,
        job_ids: [selectedJob.id],
        skills: selectedTech.map((skill, index) => ({
          skill_id: skill.id,
          display_order: index + 1,
        })),
        introduction: introduction.trim(),
      });
      router.replace('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled =
    isSubmitting ||
    !selectedJob ||
    !selectedCareer ||
    selectedTech.length === 0 ||
    !nickname.trim();

  return (
    <main className="flex min-h-screen flex-col bg-[#F7F7F7] px-6 pb-10 pt-4 text-text-body">
      <header className="relative"></header>

      <section className="mt-10 flex flex-1 flex-col gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Image src={iconMarkB} alt="" width={28} height={28} />
            <p className="text-2xl font-semibold text-text-title">환영합니다!</p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
              {displayRole}
            </span>
          </div>
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
          <div className="text-base font-semibold text-black">닉네임</div>
          <Input.Root className="mt-2">
            <div className="relative">
              <Input.Field
                placeholder="닉네임을 입력해 주세요"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                className="rounded-none pr-14 text-base text-black"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-caption">
                {nickname.length} / 15
              </span>
            </div>
          </Input.Root>
          <div className="mt-2 text-xs text-red-500">이미 사용중인 닉네임입니다</div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setActiveSheet('job')}
            className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center gap-3">
              <Image src={iconJob} alt="직무" width={40} height={40} />
              <div className="text-left">
                <span className="text-base font-semibold text-text-body">직무</span>
                <p className="mt-1 text-xs text-text-caption">
                  {selectedJob?.name || '직무를 선택해 주세요'}
                </p>
              </div>
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              {selectedJob ? (
                <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
                  {selectedJob.name}
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
              <Image src={iconCareer} alt="경력" width={40} height={40} />
              <div className="text-left">
                <span className="text-base font-semibold text-text-body">경력</span>
                <p className="mt-1 text-xs text-text-caption">
                  {selectedCareer?.level || '경력을 선택해 주세요'}
                </p>
              </div>
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              {selectedCareer ? (
                <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
                  {selectedCareer.level}
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
              <Image src={iconTech} alt="기술스택" width={40} height={40} />
              <div className="text-left">
                <span className="text-base font-semibold text-text-body">기술스택</span>
                <p className="mt-1 text-xs text-text-caption">기술을 선택해 주세요</p>
              </div>
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              {selectedTech.map((tech) => (
                <span
                  key={tech.id}
                  className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]"
                >
                  {tech.name}
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
              className="h-28 w-full resize-none text-base text-text-body placeholder:text-gray-400 focus:outline-none"
              placeholder="Tell us everything..."
              value={introduction}
              onChange={(event) => setIntroduction(event.target.value)}
            />
            <p className="mt-2 text-right text-xs text-text-caption">0/300</p>
          </div>
        </div>
      </section>

      <div className="pt-6">
        <Button
          icon={<Image src={iconMark} alt="" width={20} height={20} />}
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
        >
          가입 완료
        </Button>
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
                  key={tech.id}
                  type="button"
                  onClick={() => toggleTech(tech)}
                  className="rounded-full border border-[#bcd1f5] bg-[#edf4ff] px-3 py-1 text-xs text-[#2b4b7e]"
                >
                  {tech.name} ×
                </button>
              ))}
            </div>
            <div className="mt-6 flex max-h-[36vh] flex-col gap-3 overflow-y-auto pr-1">
              {skillsLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
              {skillsError ? <p className="text-sm text-red-500">{skillsError}</p> : null}
              {!skillsLoading && !skillsError
                ? filteredTech.map((item) => {
                    const isSelected = selectedTech.some((tech) => tech.id === item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleTech(item)}
                        className="flex items-center justify-between border-b border-gray-100 pb-3 text-left"
                      >
                        <span className="text-sm font-medium text-text-body">{item.name}</span>
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
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedJob(item)}
                    className="flex items-center justify-between text-left"
                  >
                    <span className="text-sm font-medium text-text-body">{item.name}</span>
                    <span
                      className={`h-5 w-5 rounded-md border ${
                        selectedJob?.id === item.id
                          ? 'border-[#2b4b7e] bg-[#2b4b7e]'
                          : 'border-gray-300'
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
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedCareer(item)}
                    className="flex items-center justify-between text-left"
                  >
                    <span className="text-sm font-medium text-text-body">{item.level}</span>
                    <span
                      className={`h-5 w-5 rounded-md border ${
                        selectedCareer?.id === item.id
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
