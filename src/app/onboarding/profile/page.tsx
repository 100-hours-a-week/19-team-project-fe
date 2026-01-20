import { OnboardingProfileForm } from '@/widgets/onboarding';

type OnboardingProfilePageProps = {
  searchParams?: {
    role?: string;
  };
};

export default function OnboardingProfilePage({ searchParams }: OnboardingProfilePageProps) {
  const role = searchParams?.role === 'expert' ? 'expert' : 'seeker';

  return <OnboardingProfileForm role={role} />;
}
