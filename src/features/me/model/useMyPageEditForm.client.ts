'use client';

import { useState } from 'react';

import type { CareerLevel, Job, Skill } from '@/entities/onboarding';

export type SheetId = 'job' | 'career' | 'tech' | null;

export function useMyPageEditForm() {
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);
  const [nickname, setNickname] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerLevel | null>(null);
  const [selectedTech, setSelectedTech] = useState<Skill[]>([]);
  const [techQuery, setTechQuery] = useState('');
  const [techLimitMessage, setTechLimitMessage] = useState<string | null>(null);

  const handleTechToggle = (skill: Skill) => {
    const exists = selectedTech.some((item) => item.id === skill.id);
    const next = exists
      ? selectedTech.filter((item) => item.id !== skill.id)
      : [...selectedTech, skill];

    if (next.length > 5) {
      setTechLimitMessage('기술 스택은 최대 5개까지 선택할 수 있어요.');
      return;
    }

    setTechLimitMessage(null);
    setSelectedTech(next);
  };

  return {
    activeSheet,
    setActiveSheet,
    nickname,
    setNickname,
    introduction,
    setIntroduction,
    selectedJob,
    setSelectedJob,
    selectedCareer,
    setSelectedCareer,
    selectedTech,
    setSelectedTech,
    techQuery,
    setTechQuery,
    techLimitMessage,
    handleTechToggle,
  };
}
