'use client';

import { useShallow } from 'zustand/react/shallow';

import { useResumeEditStore } from '@/features/resume';
import { SimpleItemsSection } from './SimpleItemsSection';
import { useRenderMetric } from './useRenderMetric';

export function AwardSection() {
  useRenderMetric('ResumeEdit.AwardSection');

  const { awards, addAward, updateAward, removeAward } = useResumeEditStore(
    useShallow((state) => ({
      awards: state.awards,
      addAward: state.addAward,
      updateAward: state.updateAward,
      removeAward: state.removeAward,
    })),
  );

  return (
    <SimpleItemsSection
      title="수상"
      items={awards}
      onAdd={addAward}
      onUpdate={updateAward}
      onRemove={removeAward}
      removeAriaLabel="수상 삭제"
      addLabel="+ 수상 내역 추가"
    />
  );
}
