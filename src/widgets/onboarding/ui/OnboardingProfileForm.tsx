'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import type { CareerLevel, Job, Skill } from '@/entities/onboarding';
import { getCareerLevels, getJobs, getSkills, signup } from '@/features/onboarding';
import { BusinessError } from '@/shared/api';
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

const nicknameLimit = 10;
const introductionLimit = 500;

const roleTitle: Record<RoleId, string> = {
  seeker: '구직자',
  expert: '현직자',
};

const signupErrorMessages: Record<string, string> = {
  SIGNUP_OAUTH_PROVIDER_INVALID: '소셜 로그인 제공자가 올바르지 않습니다.',
  SIGNUP_OAUTH_ID_EMPTY: '소셜 로그인 정보가 필요합니다.',
  NICKNAME_EMPTY: '닉네임을 입력해 주세요.',
  SIGNUP_USER_TYPE_INVALID: '유저 타입이 올바르지 않습니다.',
  CAREER_LEVEL_NOT_FOUND: '선택한 경력이 올바르지 않습니다.',
};

const defaultSignupErrorMessage = '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.';

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
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    const debugPayload = (() => {
      let oauthId = '';
      let fallbackNickname = '';
      const email = '';
      const raw = sessionStorage.getItem('kakaoLoginResult');
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as {
            signup_required?: {
              oauth_provider?: string;
              oauth_id?: string;
              email?: string | null;
              nickname?: string | null;
            };
          };
          const signupRequired = parsed.signup_required;
          if (signupRequired) {
            oauthId = signupRequired.oauth_id ?? '';
            fallbackNickname = signupRequired.nickname ?? '';
          }
        } catch {
          // Ignore debug parse errors.
        }
      }

      return {
        oauth_provider: 'KAKAO',
        oauth_id: oauthId,
        email,
        nickname: nickname.trim() || fallbackNickname,
        user_type: 'JOB_SEEKER',
        career_level_id: selectedCareer?.id ?? null,
        job_ids: selectedJob ? [selectedJob.id] : [],
        skills: selectedTech.map((skill, index) => ({
          skill_id: skill.id,
          display_order: index + 1,
        })),
        introduction: introduction.trim(),
      };
    })();

    alert(JSON.stringify(debugPayload, null, 2));

    if (!selectedJob || !selectedCareer || selectedTech.length === 0) {
      setSubmitError('직무, 경력, 기술스택을 모두 선택해 주세요.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const raw = sessionStorage.getItem('kakaoLoginResult');
      if (!raw) {
        setSubmitError('소셜 로그인 정보가 없습니다. 다시 로그인해 주세요.');
        return;
      }

      let oauthId = '';
      let fallbackNickname = '';
      const email = '';

      try {
        const parsed = JSON.parse(raw) as {
          signup_required?: {
            oauth_provider?: string;
            oauth_id?: string;
            email?: string | null;
            nickname?: string | null;
          };
        };
        const signupRequired = parsed.signup_required;
        if (signupRequired) {
          oauthId = signupRequired.oauth_id ?? '';
          fallbackNickname = signupRequired.nickname ?? '';
        }
      } catch {
        setSubmitError('로그인 정보 파싱에 실패했습니다. 다시 로그인해 주세요.');
        return;
      }

      const resolvedNickname = nickname.trim() || fallbackNickname;
      if (!oauthId) {
        setSubmitError('소셜 로그인 정보가 부족합니다. 다시 로그인해 주세요.');
        return;
      }
      if (!resolvedNickname) {
        setSubmitError('닉네임을 입력해 주세요.');
        return;
      }

      const signupPayload = {
        oauth_provider: 'KAKAO' as const,
        oauth_id: oauthId,
        email,
        nickname: resolvedNickname,
        user_type: 'JOB_SEEKER' as const,
        career_level_id: selectedCareer.id,
        job_ids: [selectedJob.id],
        skills: selectedTech.map((skill, index) => ({
          skill_id: skill.id,
          display_order: index + 1,
        })),
        introduction: introduction.trim(),
      };

      const signupResponse = await signup({
        ...signupPayload,
      });
      document.cookie = `access_token=${encodeURIComponent(signupResponse.access_token)}; path=/`;
      document.cookie = `refresh_token=${encodeURIComponent(signupResponse.refresh_token)}; path=/`;
      document.cookie = `user_id=${encodeURIComponent(String(signupResponse.user_id))}; path=/`;
      sessionStorage.setItem('signupSuccess', '1');
      router.replace('/');
    } catch (error: unknown) {
      if (error instanceof BusinessError) {
        setSubmitError(
          signupErrorMessages[error.code] ?? error.message ?? defaultSignupErrorMessage,
        );
      } else if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError(defaultSignupErrorMessage);
      }
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

      <section className="onboarding-form-stagger mt-10 flex flex-1 flex-col gap-6">
        <div className="onboarding-form-stagger__item">
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
          <div className="onboarding-form-stagger__item rounded-xl border border-gray-200 bg-white p-4">
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

        <div className="onboarding-form-stagger__item rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
          <div className="text-base font-semibold text-black">닉네임</div>
          <Input.Root className="mt-2">
            <div className="relative">
              <Input.Field
                placeholder="닉네임을 입력해 주세요"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                maxLength={nicknameLimit}
                className="rounded-none pr-14 text-base text-black"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-caption">
                {nickname.length} / {nicknameLimit}
              </span>
            </div>
          </Input.Root>
        </div>

        <div className="onboarding-form-stagger__item flex flex-col gap-3">
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

        <div className="onboarding-form-stagger__item">
          <p className="text-base font-semibold text-text-title">자기 소개</p>
          <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <textarea
              className="h-28 w-full resize-none text-base text-text-body placeholder:text-gray-400 focus:outline-none"
              placeholder="Tell us everything..."
              value={introduction}
              onChange={(event) => setIntroduction(event.target.value)}
              maxLength={introductionLimit}
            />
            <p className="mt-2 text-right text-xs text-text-caption">
              {introduction.length}/{introductionLimit}
            </p>
          </div>
        </div>
      </section>

      <div className="onboarding-form-stagger__item pt-6">
        {submitError ? <p className="mb-3 text-sm text-red-500">{submitError}</p> : null}
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
          <div className="flex h-full flex-col">
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
            <div className="mt-6 flex flex-col gap-3 pr-1">
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
          <div className="flex h-full flex-col">
            {jobsLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
            {jobsError ? <p className="text-sm text-red-500">{jobsError}</p> : null}
            {!jobsLoading && !jobsError ? (
              <div className="flex flex-col gap-6 pr-1">
                {jobs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedJob(item)}
                    className="flex items-center justify-between py-2 text-left"
                  >
                    <span className="text-xl font-semibold text-text-body">{item.name}</span>
                    <span
                      className={`h-5 w-5 rounded-md border ${
                        selectedJob?.id === item.id
                          ? 'border-[#2b4b7e] bg-[#2b4b7e]'
                          : 'border-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {activeSheet === 'career' ? (
          <div className="flex h-full flex-col">
            {careerLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
            {careerError ? <p className="text-sm text-red-500">{careerError}</p> : null}
            {!careerLoading && !careerError ? (
              <div className="flex flex-col gap-6 pr-1">
                {careerLevels.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedCareer(item)}
                    className="flex items-center justify-between py-2 text-left"
                  >
                    <span className="text-xl font-semibold text-text-body">{item.level}</span>
                    <span
                      className={`h-5 w-5 rounded-md border ${
                        selectedCareer?.id === item.id
                          ? 'border-[#2b4b7e] bg-[#2b4b7e]'
                          : 'border-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </BottomSheet>
    </main>
  );
}
