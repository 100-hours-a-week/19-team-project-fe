'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { CareerLevel, Job, Skill } from '@/entities/onboarding';

export type SheetId = 'job' | 'career' | 'tech' | null;

type OnboardingFormValues = {
  selectedJob: Job | null;
  selectedCareer: CareerLevel | null;
  selectedTech: Skill[];
  nickname: string;
  introduction: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  pledgeAgreed: boolean;
};

export function useOnboardingFormState(isExpert: boolean) {
  const [currentStep, setCurrentStep] = useState<0 | 1>(() => (isExpert ? 0 : 1));
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);
  const {
    control,
    setValue,
    getValues,
  } = useForm<OnboardingFormValues>({
    defaultValues: {
      selectedJob: null,
      selectedCareer: null,
      selectedTech: [],
      nickname: '',
      introduction: '',
      termsAgreed: false,
      privacyAgreed: false,
      pledgeAgreed: false,
    },
  });
  const [techQuery, setTechQuery] = useState('');
  const [techLimitMessage, setTechLimitMessage] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [pledgeOpen, setPledgeOpen] = useState(false);
  const [privacyPledgeOpen, setPrivacyPledgeOpen] = useState(false);
  const selectedJob = useWatch({ control, name: 'selectedJob' });
  const selectedCareer = useWatch({ control, name: 'selectedCareer' });
  const selectedTech = useWatch({ control, name: 'selectedTech' }) ?? [];
  const nickname = useWatch({ control, name: 'nickname' }) ?? '';
  const introduction = useWatch({ control, name: 'introduction' }) ?? '';
  const termsAgreed = useWatch({ control, name: 'termsAgreed' }) ?? false;
  const privacyAgreed = useWatch({ control, name: 'privacyAgreed' }) ?? false;
  const pledgeAgreed = useWatch({ control, name: 'pledgeAgreed' }) ?? false;

  const setSelectedJob = (value: Job | null) => {
    setValue('selectedJob', value, { shouldDirty: true, shouldValidate: true });
  };

  const setSelectedCareer = (value: CareerLevel | null) => {
    setValue('selectedCareer', value, { shouldDirty: true, shouldValidate: true });
  };

  const setSelectedTech = (value: Skill[]) => {
    setValue('selectedTech', value, { shouldDirty: true, shouldValidate: true });
  };

  const setNickname = (value: string) => {
    setValue('nickname', value, { shouldDirty: true, shouldValidate: true });
  };

  const setIntroduction = (value: string) => {
    setValue('introduction', value, { shouldDirty: true, shouldValidate: true });
  };

  const setTermsAgreed = (value: boolean) => {
    setValue('termsAgreed', value, { shouldDirty: true, shouldValidate: true });
  };

  const setPrivacyAgreed = (value: boolean) => {
    setValue('privacyAgreed', value, { shouldDirty: true, shouldValidate: true });
  };

  const setPledgeAgreed = (value: boolean) => {
    setValue('pledgeAgreed', value, { shouldDirty: true, shouldValidate: true });
  };

  const handleTechToggle = (skill: Skill) => {
    const currentTech = getValues('selectedTech');
    if (!Array.isArray(currentTech)) return;

    const exists = currentTech.some((item) => item.id === skill.id);
    const next = exists
      ? currentTech.filter((item) => item.id !== skill.id)
      : [...currentTech, skill];

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
