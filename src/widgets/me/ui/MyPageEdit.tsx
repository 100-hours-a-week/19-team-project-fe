'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useMyPageEdit } from '@/features/me';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Input } from '@/shared/ui/input';
import iconCareer from '@/shared/icons/icon_career.png';
import iconJob from '@/shared/icons/Icon_job.png';
import iconTech from '@/shared/icons/Icon_tech.png';
import iconMark from '@/shared/icons/icon-mark.png';
import defaultUserImage from '@/shared/icons/char_icon.png';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';
import { Button } from '@/shared/ui/button';

export default function MyPageEdit() {
  const router = useRouter();
  const {
    activeSheet,
    setActiveSheet,
    jobs,
    careerLevels,
    jobsLoading,
    careerLoading,
    skillsLoading,
    jobsError,
    careerError,
    skillsError,
    techLimitMessage,
    nickname,
    setNickname,
    introduction,
    setIntroduction,
    selectedJob,
    setSelectedJob,
    selectedCareer,
    setSelectedCareer,
    selectedTech,
    techQuery,
    setTechQuery,
    profileImageUrl,
    profileImagePreview,
    nicknameCheckMessage,
    isNicknameChecking,
    isSubmitting,
    isUploadingImage,
    submitError,
    fileInputRef,
    filteredTech,
    nicknameLimit,
    introductionLimit,
    handleProfileImageChange,
    handleProfileImageReset,
    handleNicknameCheck,
    handleTechToggle,
    handleSubmit,
  } = useMyPageEdit();

  const selectedTechIds = new Set(selectedTech.map((tech) => tech.id));
  const filteredSkills = filteredTech;
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <Header />

      <section className="px-4 pt-6 pb-[calc(var(--app-footer-height)+16px)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('nav-direction', 'back');
              router.back();
            }}
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

        <div className="mt-8 flex flex-col gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <div className="text-base font-semibold text-black">프로필 이미지</div>
            <div className="mt-3 flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-neutral-100">
                <Image
                  src={profileImagePreview ?? profileImageUrl ?? defaultUserImage}
                  alt="프로필 이미지"
                  width={80}
                  height={80}
                  unoptimized={!!profileImagePreview || !!profileImageUrl}
                  className="h-20 w-20 object-cover"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleProfileImageReset}
                    disabled={
                      isSubmitting || isUploadingImage || (!profileImagePreview && !profileImageUrl)
                    }
                    className="rounded-full border border-neutral-300 px-2.5 py-1.5 text-sm font-semibold text-neutral-700 disabled:opacity-60"
                  >
                    기본 이미지
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting || isUploadingImage}
                    className="rounded-full border border-neutral-300 px-2.5 py-1.5 text-sm font-semibold text-neutral-700 disabled:opacity-60"
                  >
                    {profileImagePreview ? '다른 이미지 선택' : '이미지 업로드'}
                  </button>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <p className="text-text-caption">jpg/png 권장</p>
                  <p className="text-primary-main">최대 10MB까지 업로드할 수 있어요.</p>
                </div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfileImageChange}
            />
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <div className="text-base font-semibold text-black">닉네임</div>
            <Input.Root className="mt-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input.Field
                    placeholder="닉네임을 입력해 주세요"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    maxLength={nicknameLimit}
                    className="rounded-none border-0 border-b-2 border-black bg-transparent px-0 py-2 pr-14 text-base text-black shadow-none focus:border-black focus:ring-0 disabled:border-black disabled:bg-transparent"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-caption leading-tight">
                    {nickname.length} / {nicknameLimit}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNicknameCheck}
                  disabled={isNicknameChecking || nickname.trim().length === 0}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 text-neutral-400 enabled:border-[var(--color-primary-main)] enabled:bg-[var(--color-primary-main)] enabled:text-white"
                >
                  <svg
                    data-slot="icon"
                    fill="none"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </button>
              </div>
              {nicknameCheckMessage ? (
                <p
                  className={`mt-1 text-xs leading-tight ${
                    nicknameCheckMessage.tone === 'success' ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {nicknameCheckMessage.text}
                </p>
              ) : null}
            </Input.Root>
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

          <div className="rounded-3xl bg-white px-4 py-5 shadow-sm">
            <p className="text-base font-semibold text-text-title">자기 소개</p>
            <textarea
              className="mt-3 h-28 w-full resize-none text-base text-text-body placeholder:text-gray-400 focus:outline-none"
              placeholder="자기 소개를 입력해 주세요"
              value={introduction}
              onChange={(event) => setIntroduction(event.target.value)}
              maxLength={introductionLimit}
            />
            <p className="mt-2 text-right text-xs text-text-caption">
              {introduction.length} / {introductionLimit}
            </p>
          </div>

          {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploadingImage}
            icon={<Image src={iconMark} alt="" width={20} height={20} />}
            className="rounded-2xl py-4 text-base font-semibold"
          >
            {isSubmitting || isUploadingImage ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </section>

      <div className="mt-auto">
        <Footer />
      </div>

      <BottomSheet
        open={activeSheet !== null}
        title="선택"
        actionLabel="완료"
        onAction={() => setActiveSheet(null)}
        onClose={() => setActiveSheet(null)}
      >
        <div className="flex h-full flex-col gap-4">
          {activeSheet === 'job' ? (
            <div className="flex flex-col gap-2">
              {jobsLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
              {jobsError ? <p className="text-sm text-red-500">{jobsError}</p> : null}
              {!jobsLoading && !jobsError ? (
                <div className="flex flex-col gap-2">
                  {jobs.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedJob(item);
                        setActiveSheet(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl px-2.5 py-3 text-left transition ${
                        selectedJob?.id === item.id
                          ? 'border border-primary-main bg-primary-main/10'
                          : 'border border-gray-100 bg-white'
                      }`}
                    >
                      <span className="text-sm font-semibold text-text-body">{item.name}</span>
                      {selectedJob?.id === item.id ? (
                        <span className="text-xs text-primary-main">선택됨</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {activeSheet === 'career' ? (
            <div className="flex flex-col gap-2">
              {careerLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
              {careerError ? <p className="text-sm text-red-500">{careerError}</p> : null}
              {!careerLoading && !careerError ? (
                <div className="flex flex-col gap-2">
                  {careerLevels.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedCareer(item);
                        setActiveSheet(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl px-2.5 py-3 text-left transition ${
                        selectedCareer?.id === item.id
                          ? 'border border-primary-main bg-primary-main/10'
                          : 'border border-gray-100 bg-white'
                      }`}
                    >
                      <span className="text-sm font-semibold text-text-body">{item.level}</span>
                      {selectedCareer?.id === item.id ? (
                        <span className="text-xs text-primary-main">선택됨</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {activeSheet === 'tech' ? (
            <div className="flex h-full flex-col gap-3">
              <input
                className="rounded-2xl border border-gray-200 px-4 py-2 text-sm focus:outline-none"
                placeholder="기술을 검색해 주세요"
                value={techQuery}
                onChange={(event) => setTechQuery(event.target.value)}
              />
              {skillsLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
              {skillsError ? <p className="text-sm text-red-500">{skillsError}</p> : null}
              {techLimitMessage ? <p className="text-xs text-red-500">{techLimitMessage}</p> : null}
              {!skillsLoading && !skillsError ? (
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {filteredSkills.map((item) => {
                    const isSelected = selectedTechIds.has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTechToggle(item)}
                        className={`flex w-full items-center justify-between rounded-2xl px-2.5 py-3 text-left transition ${
                          isSelected
                            ? 'border border-primary-main bg-primary-main/10'
                            : 'border border-gray-100 bg-white'
                        }`}
                      >
                        <span className="text-sm font-semibold text-text-body">{item.name}</span>
                        {isSelected ? (
                          <span className="text-xs text-primary-main">선택됨</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </BottomSheet>
    </div>
  );
}
