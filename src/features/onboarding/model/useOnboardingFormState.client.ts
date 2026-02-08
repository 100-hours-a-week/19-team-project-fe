'use client';

import { useState } from 'react';

import type { CareerLevel, Job, Skill } from '@/entities/onboarding';

export type SheetId = 'job' | 'career' | 'tech' | null;

export function useOnboardingFormState(isExpert: boolean) {
  const [currentStep, setCurrentStep] = useState<0 | 1>(() => (isExpert ? 0 : 1));
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerLevel | null>(null);
  const [selectedTech, setSelectedTech] = useState<Skill[]>([]);
  const [techQuery, setTechQuery] = useState('');
  const [techLimitMessage, setTechLimitMessage] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [pledgeOpen, setPledgeOpen] = useState(false);
  const [privacyPledgeOpen, setPrivacyPledgeOpen] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [pledgeAgreed, setPledgeAgreed] = useState(false);

  const handleTechToggle = (skill: Skill) => {
    const exists = selectedTech.some((item) => item.id === skill.id);
    const next = exists
      ? selectedTech.filter((item) => item.id !== skill.id)
      : [...selectedTech, skill];

    if (!exists && next.length > 5) {
      setTechLimitMessage('기술 스택은 최대 5개까지 선택할 수 있어요.');
      return;
    }

    setTechLimitMessage(null);
    setSelectedTech(next);
  };

  return {
    currentStep,
    setCurrentStep,
    activeSheet,
    setActiveSheet,
    selectedJob,
    setSelectedJob,
    selectedCareer,
    setSelectedCareer,
    selectedTech,
    setSelectedTech,
    techQuery,
    setTechQuery,
    techLimitMessage,
    nickname,
    setNickname,
    introduction,
    setIntroduction,
    termsOpen,
    setTermsOpen,
    privacyOpen,
    setPrivacyOpen,
    pledgeOpen,
    setPledgeOpen,
    privacyPledgeOpen,
    setPrivacyPledgeOpen,
    termsAgreed,
    setTermsAgreed,
    privacyAgreed,
    setPrivacyAgreed,
    pledgeAgreed,
    setPledgeAgreed,
    handleTechToggle,
  };
}
