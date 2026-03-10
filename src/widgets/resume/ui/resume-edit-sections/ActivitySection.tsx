'use client';

import { useShallow } from 'zustand/react/shallow';

import { useResumeEditStore } from '@/features/resume';
import { SimpleItemsSection } from './SimpleItemsSection';
import { useRenderMetric } from './useRenderMetric';

export function ActivitySection() {
  useRenderMetric('ResumeEdit.ActivitySection');

  const { activities, addActivity, updateActivity, removeActivity } = useResumeEditStore(
    useShallow((state) => ({
      activities: state.activities,
      addActivity: state.addActivity,
      updateActivity: state.updateActivity,
      removeActivity: state.removeActivity,
    })),
  );

  return (
    <SimpleItemsSection
      title="활동"
      items={activities}
      onAdd={addActivity}
      onUpdate={updateActivity}
      onRemove={removeActivity}
      removeAriaLabel="활동 삭제"
      addLabel="+ 활동 추가"
    />
  );
}
