'use client';

import { useShallow } from 'zustand/react/shallow';

import { useResumeEditStore } from '@/features/resume';
import { SimpleItemsSection } from './SimpleItemsSection';
import { useRenderMetric } from './useRenderMetric';

export function CertificateSection() {
  useRenderMetric('ResumeEdit.CertificateSection');

  const { certificates, addCertificate, updateCertificate, removeCertificate } = useResumeEditStore(
    useShallow((state) => ({
      certificates: state.certificates,
      addCertificate: state.addCertificate,
      updateCertificate: state.updateCertificate,
      removeCertificate: state.removeCertificate,
    })),
  );

  return (
    <SimpleItemsSection
      title="자격"
      items={certificates}
      onAdd={addCertificate}
      onUpdate={updateCertificate}
      onRemove={removeCertificate}
      removeAriaLabel="자격증 삭제"
      addLabel="+ 자격증 추가"
    />
  );
}
