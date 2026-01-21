import { OnboardingProfileForm } from '@/widgets/onboarding';

type OnboardingProfilePageProps = {
  searchParams?: {
    role?: string;
  };
};

export default function OnboardingProfilePage({ searchParams }: OnboardingProfilePageProps) {
  const normalizedRole = searchParams?.role?.toLowerCase();
  const role = normalizedRole === 'expert' ? 'expert' : 'seeker';

  return <OnboardingProfileForm role={role} />;
}
