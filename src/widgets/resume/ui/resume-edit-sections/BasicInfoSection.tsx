'use client';

import { useShallow } from 'zustand/react/shallow';

import { useResumeEditStore } from '@/features/resume';
import { Input } from '@/shared/ui/input';
import { useRenderMetric } from './useRenderMetric';

type BasicInfoSectionProps = {
  educationOptions: readonly string[];
};

export function BasicInfoSection({ educationOptions }: BasicInfoSectionProps) {
  useRenderMetric('ResumeEdit.BasicInfoSection');

  const { title, setTitle, isFresher, setIsFresher, education, setEducationValue } =
    useResumeEditStore(
      useShallow((state) => ({
        title: state.title,
        setTitle: state.setTitle,
        isFresher: state.isFresher,
        setIsFresher: state.setIsFresher,
        education: state.education,
        setEducationValue: state.setEducationValue,
      })),
    );

  return (
    <section>
      <h2 className="text-lg font-semibold text-black">기본 정보</h2>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-card-soft">
        <Input.Root>
          <Input.Label>
            이력서 제목 <span className="text-red-500">*</span>
          </Input.Label>
          <Input.Field
            placeholder="텍스트를 입력해 주세요."
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Input.Root>

        <p className="mt-4 text-sm font-semibold text-gray-700">
          학력 <span className="text-red-500">*</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {educationOptions.map((level) => {
            const selected = (education[0]?.value ?? '') === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => setEducationValue(level)}
                className={`rounded-full border px-3 py-1 text-2xs font-semibold transition ${
                  selected
                    ? 'border-primary-main bg-primary-main/10 text-primary-main'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-sm font-semibold text-gray-700">
          신입/경력 <span className="text-red-500">*</span>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsFresher(true)}
            className={`rounded-xl border px-2.5 py-3 text-sm font-semibold transition ${
              isFresher
                ? 'border-primary-main bg-primary-main/10 text-primary-main'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            신입
          </button>
          <button
            type="button"
            onClick={() => setIsFresher(false)}
            className={`rounded-xl border px-2.5 py-3 text-sm font-semibold transition ${
              !isFresher
                ? 'border-primary-main bg-primary-main/10 text-primary-main'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            경력
          </button>
        </div>
      </div>
    </section>
  );
}
