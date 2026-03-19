'use client';

import { useShallow } from 'zustand/react/shallow';

import { useResumeEditStore } from '@/features/resume';
import { inlineFieldClass } from './constants';
import { useRenderMetric } from './useRenderMetric';

export function CareerSection() {
  useRenderMetric('ResumeEdit.CareerSection');

  const { isFresher, careers, addCareer, updateCareer, removeCareer } = useResumeEditStore(
    useShallow((state) => ({
      isFresher: state.isFresher,
      careers: state.careers,
      addCareer: state.addCareer,
      updateCareer: state.updateCareer,
      removeCareer: state.removeCareer,
    })),
  );

  if (isFresher) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold text-black">경력</h2>
      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-card-soft">
        {careers.map((career, index) => (
          <div
            key={career.id}
            className={`rounded-xl border border-gray-200 p-3 ${index > 0 ? 'mt-3' : ''}`}
          >
            <div className="flex items-center gap-2">
              <input
                placeholder="회사명"
                value={career.company}
                onChange={(event) => updateCareer(career.id, { company: event.target.value })}
                className={`${inlineFieldClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => removeCareer(career.id)}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-xl text-gray-500"
                aria-label="경력 삭제"
              >
                -
              </button>
            </div>
            <input
              placeholder="YYYY.MM - YYYY.MM (0년 0개월)"
              value={career.period}
              onChange={(event) => updateCareer(career.id, { period: event.target.value })}
              className={`${inlineFieldClass} mt-2`}
            />
            <input
              placeholder="직무"
              value={career.role}
              onChange={(event) => updateCareer(career.id, { role: event.target.value })}
              className={`${inlineFieldClass} mt-2`}
            />
            <input
              placeholder="직책"
              value={career.title}
              onChange={(event) => updateCareer(career.id, { title: event.target.value })}
              className={`${inlineFieldClass} mt-2`}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addCareer}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 py-2 text-sm text-gray-600"
        >
          + 주요 경력 추가
        </button>
      </div>
    </section>
  );
}
