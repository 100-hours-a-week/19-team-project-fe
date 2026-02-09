import { useMemo } from 'react';

import type { Skill } from '@/entities/onboarding';
import { useOnboardingFormState } from './useOnboardingFormState.client';
import { useOnboardingReferenceData } from './useOnboardingReferenceData.client';
import { useOnboardingOauthInfo } from './useOnboardingOauthInfo.client';
import { useOnboardingNicknameCheck } from './useOnboardingNicknameCheck.client';
import { useOnboardingEmailVerification } from './useOnboardingEmailVerification.client';
import { useOnboardingSubmit } from './useOnboardingSubmit.client';

const nicknameLimit = 10;
const introductionLimit = 100;

export function useOnboardingProfileForm(isExpert: boolean) {
  const form = useOnboardingFormState(isExpert);
  const reference = useOnboardingReferenceData();
  const oauth = useOnboardingOauthInfo({
    nickname: form.nickname,
    setNickname: form.setNickname,
  });
  const nicknameCheck = useOnboardingNicknameCheck(nicknameLimit);
  const emailVerification = useOnboardingEmailVerification(isExpert);
  const submit = useOnboardingSubmit({
    isExpert,
    oauthId: oauth.oauthId,
    oauthEmail: oauth.oauthEmail,
    nickname: form.nickname,
    introduction: form.introduction,
    selectedJob: form.selectedJob,
    selectedCareer: form.selectedCareer,
    selectedTech: form.selectedTech,
    checkedNickname: nicknameCheck.checkedNickname,
    isVerified: emailVerification.isVerified,
    lastSentEmail: emailVerification.lastSentEmail,
    verificationEmail: emailVerification.verificationEmail,
    termsAgreed: form.termsAgreed,
    privacyAgreed: form.privacyAgreed,
    pledgeAgreed: form.pledgeAgreed,
  });

  const filteredTech = useMemo(() => {
    const query = form.techQuery.trim();
    const list = reference.skills;
    if (!query) return list;
    return list.filter((item: Skill) => item.name.toLowerCase().includes(query.toLowerCase()));
  }, [form.techQuery, reference.skills]);

  const allRequiredAgreed =
    form.termsAgreed && form.privacyAgreed && (!isExpert || form.pledgeAgreed);

  const isNicknameCheckDisabled =
    nicknameCheck.isNicknameChecking ||
    form.nickname.trim().length === 0 ||
    form.nickname.trim().length >= nicknameLimit;

  const isSubmitDisabled =
    submit.isSubmitting ||
    !form.selectedJob ||
    !form.selectedCareer ||
    (form.selectedTech.length === 0 && !isExpert) ||
    !form.nickname.trim() ||
    !allRequiredAgreed;

  return {
    currentStep: form.currentStep,
    setCurrentStep: form.setCurrentStep,
    activeSheet: form.activeSheet,
    setActiveSheet: form.setActiveSheet,
    selectedJob: form.selectedJob,
    setSelectedJob: form.setSelectedJob,
    selectedCareer: form.selectedCareer,
    setSelectedCareer: form.setSelectedCareer,
    selectedTech: form.selectedTech,
    setSelectedTech: form.setSelectedTech,
    techQuery: form.techQuery,
    setTechQuery: form.setTechQuery,
    skills: reference.skills,
    metadataLoading: reference.metadataLoading,
    metadataError: reference.metadataError,
    techLimitMessage: form.techLimitMessage,
    jobs: reference.jobs,
    careerLevels: reference.careerLevels,
    verificationEmail: emailVerification.verificationEmail,
    setVerificationEmail: emailVerification.setVerificationEmail,
    isVerificationVisible: emailVerification.isVerificationVisible,
    verificationCode: emailVerification.verificationCode,
    lastSentEmail: emailVerification.lastSentEmail,
    isSendingVerification: emailVerification.isSendingVerification,
    sendVerificationMessage: emailVerification.sendVerificationMessage,
    sendVerificationError: emailVerification.sendVerificationError,
    isVerifying: emailVerification.isVerifying,
    verificationError: emailVerification.verificationError,
    isVerified: emailVerification.isVerified,
    isVerificationFailSheetOpen: emailVerification.isVerificationFailSheetOpen,
    setIsVerificationFailSheetOpen: emailVerification.setIsVerificationFailSheetOpen,
    remainingSeconds: emailVerification.remainingSeconds,
    nickname: form.nickname,
    setNickname: form.setNickname,
    introduction: form.introduction,
    setIntroduction: form.setIntroduction,
    isSubmitting: submit.isSubmitting,
    submitError: submit.submitError,
    termsOpen: form.termsOpen,
    setTermsOpen: form.setTermsOpen,
    privacyOpen: form.privacyOpen,
    setPrivacyOpen: form.setPrivacyOpen,
    pledgeOpen: form.pledgeOpen,
    setPledgeOpen: form.setPledgeOpen,
    privacyPledgeOpen: form.privacyPledgeOpen,
    setPrivacyPledgeOpen: form.setPrivacyPledgeOpen,
    termsAgreed: form.termsAgreed,
    setTermsAgreed: form.setTermsAgreed,
    privacyAgreed: form.privacyAgreed,
    setPrivacyAgreed: form.setPrivacyAgreed,
    pledgeAgreed: form.pledgeAgreed,
    setPledgeAgreed: form.setPledgeAgreed,
    nicknameCheckMessage: nicknameCheck.nicknameCheckMessage,
    isNicknameChecking: nicknameCheck.isNicknameChecking,
    checkedNickname: nicknameCheck.checkedNickname,
    handleSubmit: () => submit.handleSubmit(nicknameLimit),
    handleNicknameCheck: () => nicknameCheck.handleNicknameCheck(form.nickname),
    handleSendVerification: emailVerification.handleSendVerification,
    handleKeypadPress: emailVerification.handleKeypadPress,
    handleVerifySubmit: emailVerification.handleVerifySubmit,
    handleTechToggle: form.handleTechToggle,
    filteredTech,
    allRequiredAgreed,
    isNicknameCheckDisabled,
    isSubmitDisabled,
    isVerificationSubmitDisabled: emailVerification.isVerificationSubmitDisabled,
    nicknameLimit,
    introductionLimit,
    verificationCodeLength: emailVerification.verificationCodeLength,
  };
}
