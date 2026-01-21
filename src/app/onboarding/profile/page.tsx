import { OnboardingProfileForm } from '@/widgets/onboarding';

type OnboardingProfilePageProps = {
  searchParams?: Promise<{
    role?: string;
  }>;
};

export default async function OnboardingProfilePage({ searchParams }: OnboardingProfilePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const normalizedRole = params?.role?.toLowerCase();
  const role = normalizedRole === 'expert' ? 'expert' : 'seeker';

  return <OnboardingProfileForm role={role} />;
}
