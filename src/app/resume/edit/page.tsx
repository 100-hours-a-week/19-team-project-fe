import { Suspense } from 'react';

import { ResumeEditPage } from '@/widgets/resume-edit';

export default function ResumeEditRoute() {
  return (
    <Suspense fallback={null}>
      <ResumeEditPage />
    </Suspense>
  );
}
