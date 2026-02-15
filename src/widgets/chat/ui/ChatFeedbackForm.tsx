'use client';

import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { useChatFeedbackForm } from '@/features/chat';

interface ChatFeedbackFormProps {
  chatId: number;
}

export default function ChatFeedbackForm({ chatId }: ChatFeedbackFormProps) {
  const router = useRouter();
  const {
    questions,
    answers,
    validationErrors,
    step2ValidationErrors,
    submitError,
    isSubmitting,
    selectedCoreRequirements,
    step2Evaluations,
    setTextAnswer,
    setRadioAnswer,
    toggleMultiAnswer,
    setStep2Status,
    setStep2Reason,
    customMultiInputs,
    setCustomMultiInput,
    confirmCustomMultiAnswer,
    handleSubmit,
  } = useChatFeedbackForm(chatId);

  const groupedQuestions = useMemo(() => {
    const map = new Map<string, typeof questions>();

    for (const question of questions) {
      const prev = map.get(question.step) ?? [];
      map.set(question.step, [...prev, question]);
    }

    return Array.from(map.entries());
  }, [questions]);

  return (
    <div
      className="flex h-[100dvh] flex-col overflow-hidden bg-[#f4f4f4] text-black"
      style={{ '--app-header-height': '64px' } as CSSProperties}
    >
      <header className="sticky top-0 z-10 flex h-16 items-center bg-white px-4 shadow-sm">
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem('nav-direction', 'back');
            router.back();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600"
          aria-label="뒤로 가기"
        >
          <svg
            data-slot="icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex-1 px-3 text-center text-base font-semibold text-neutral-900">
          피드백 설문
        </div>
        <div className="h-9 w-9" aria-hidden="true" />
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-[600px] flex-1 flex-col gap-4 overflow-y-auto px-2.5 py-4 pb-28">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h1 className="text-sm font-semibold text-neutral-900">채팅이 종료되었습니다.</h1>
          <p className="mt-2 text-xs text-neutral-600">
            피드백 채팅은 양측 모두 설문을 제출해야 최종 종료됩니다.
          </p>
        </section>

        {groupedQuestions.map(([step, stepQuestions]) => (
          <section key={step} className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold text-neutral-500">
              {step === 'STEP 1'
                ? '[STEP 1] 공고 핵심 요구사항 (3가지 직접 선택)'
                : step === 'STEP 5'
                  ? '[STEP 5] 2주 내 보완 가능한 액션 (2개, 자유 텍스트)'
                  : step === 'STEP 6'
                    ? '[STEP 6] 직무 적합도'
                    : step === 'STEP 7'
                      ? '[STEP 7] 서류 통과 가능성'
                      : step}
            </h2>
            {step === 'STEP 1' ? (
              <p className="mt-2 text-sm text-neutral-700">
                이 공고에서 가장 중요하다고 생각하는 역량/요건 3가지를 선택해주세요.
              </p>
            ) : null}
            <div className="mt-3 flex flex-col gap-5">
              {step === 'STEP 2' ? (
                <div className="flex flex-col gap-4">
                  <p className="text-sm font-semibold text-neutral-900">
                    위에서 선택한 핵심 요구사항에 대해 지원자의 충족 여부를 평가해주세요.
                  </p>
                  {selectedCoreRequirements.length === 0 ? (
                    <p className="text-xs text-neutral-500">STEP 1에서 먼저 3개를 선택해주세요.</p>
                  ) : (
                    selectedCoreRequirements.map((requirement, index) => {
                      const evaluation = step2Evaluations[requirement] ?? {
                        status: '',
                        reason: '',
                      };
                      const statusError = step2ValidationErrors[requirement]?.status;
                      const reasonError = step2ValidationErrors[requirement]?.reason;
                      const step2Options =
                        questions.find((question) => question.id === 2)?.options ?? [];

                      return (
                        <div key={requirement} className="rounded-xl border border-neutral-200 p-3">
                          <p className="text-sm font-semibold text-neutral-900">
                            핵심 요구사항 {index + 1}) {requirement}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {step2Options.map((option) => {
                              const checked = evaluation.status === option;

                              return (
                                <label
                                  key={`${requirement}-${option}`}
                                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${
                                    checked
                                      ? 'border-neutral-900 bg-neutral-900 text-white'
                                      : 'border-neutral-300 text-neutral-700'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`step2-${requirement}`}
                                    checked={checked}
                                    onChange={() => setStep2Status(requirement, option)}
                                    className="sr-only"
                                  />
                                  <span>{option}</span>
                                </label>
                              );
                            })}
                          </div>
                          {statusError ? (
                            <p className="mt-1 text-xs text-red-500">{statusError}</p>
                          ) : null}

                          <p className="mt-3 text-sm font-semibold text-neutral-900">
                            판단 근거(자유서술)
                          </p>
                          <textarea
                            value={evaluation.reason}
                            onChange={(event) => {
                              setStep2Reason(requirement, event.target.value, 100);
                            }}
                            rows={3}
                            className="mt-2 min-h-[88px] w-full rounded-xl border border-neutral-300 p-3 text-sm text-neutral-900 outline-none focus:border-neutral-500"
                          />
                          <p className="text-right text-xs text-neutral-400">
                            {evaluation.reason.length}/100
                          </p>
                          {reasonError ? (
                            <p className="text-xs text-red-500">{reasonError}</p>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : step === 'STEP 5' ? (
                <div className="flex flex-col gap-4">
                  {[11, 12].map((questionId, index) => {
                    const question = stepQuestions.find((item) => item.id === questionId);
                    if (!question || question.type !== 'text') return null;
                    const value =
                      typeof answers[question.id] === 'string' ? answers[question.id] : '';
                    const error = validationErrors[question.id];
                    const maxLength = question.maxLength ?? 100;

                    return (
                      <div key={question.id} className="flex items-start gap-3">
                        <span className="pt-4 text-2xl font-semibold text-neutral-900">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <textarea
                            value={value}
                            onChange={(event) => {
                              setTextAnswer(question.id, event.target.value.slice(0, maxLength));
                            }}
                            rows={4}
                            className="min-h-[160px] w-full resize-y rounded-[32px] border border-neutral-300 bg-white px-5 py-4 text-sm text-neutral-900 outline-none focus:border-neutral-400"
                          />
                          <p className="mt-1 text-right text-xs text-neutral-400">
                            {value.length}/{maxLength}
                          </p>
                          {error ? <p className="text-xs text-red-500">{error}</p> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                stepQuestions.map((question) => {
                  if (
                    question.id === 2 ||
                    question.id === 3 ||
                    question.id === 4 ||
                    question.id === 5 ||
                    question.id === 6 ||
                    question.id === 7 ||
                    question.id === 11 ||
                    question.id === 12
                  ) {
                    return null;
                  }
                  const error = validationErrors[question.id];
                  const value = answers[question.id];
                  const selectedValues = Array.isArray(value) ? value : [];

                  return (
                    <div key={question.id} className="flex flex-col gap-2">
                      {question.id === 1 ? null : (
                        <p className="text-sm font-semibold text-neutral-900">{question.label}</p>
                      )}

                      {question.type === 'multi' ? (
                        <div className="flex flex-col gap-2">
                          {question.options?.map((option) => {
                            const isOtherOption = option.startsWith('기타:');
                            const checked = isOtherOption
                              ? selectedValues.some((item) => item.startsWith('기타:'))
                              : selectedValues.includes(option);
                            const maxSelect = question.maxSelect ?? 0;
                            const disabled = !checked && selectedValues.length >= maxSelect;
                            const customSelected = selectedValues.find((item) =>
                              item.startsWith('기타:'),
                            );
                            const customValue =
                              isOtherOption && customSelected
                                ? customSelected.replace(/^기타:\s*/, '')
                                : '';

                            return (
                              <div key={option} className="flex flex-col gap-2">
                                <label
                                  className={`flex items-center gap-2 text-sm ${
                                    disabled ? 'text-neutral-400' : 'text-neutral-800'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() =>
                                      toggleMultiAnswer(question.id, option, maxSelect)
                                    }
                                    className="h-4 w-4"
                                  />
                                  <span>
                                    {isOtherOption && customSelected ? customSelected : option}
                                  </span>
                                </label>
                                {isOtherOption && checked ? (
                                  <div className="ml-6 flex items-center gap-2">
                                    <input
                                      value={customMultiInputs[question.id] ?? customValue}
                                      onChange={(event) =>
                                        setCustomMultiInput(question.id, event.target.value)
                                      }
                                      placeholder="직접 입력"
                                      className="h-8 w-40 rounded-md border border-neutral-300 bg-white px-2 text-sm"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        confirmCustomMultiAnswer(question.id, maxSelect);
                                      }}
                                      className="rounded-md bg-neutral-900 px-2.5 py-1 text-xs text-white"
                                    >
                                      확인
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}

                      {question.id === 1 && selectedCoreRequirements.length > 0 ? (
                        <div className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                          <p className="text-sm font-semibold text-neutral-800">선택한 3가지</p>
                          <ol className="mt-2 list-decimal pl-5 text-sm text-neutral-800">
                            {selectedCoreRequirements.map((selected) => (
                              <li key={selected}>{selected}</li>
                            ))}
                          </ol>
                        </div>
                      ) : null}

                      {question.type === 'radio' ? (
                        question.id === 13 || question.id === 14 ? (
                          <div className="flex flex-col gap-3">
                            {question.options?.map((option) => {
                              const checked = value === option;
                              return (
                                <label
                                  key={option}
                                  className="flex items-center gap-2 text-sm text-neutral-900"
                                >
                                  <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    checked={checked}
                                    onChange={() => setRadioAnswer(question.id, option)}
                                    className="h-4 w-4"
                                  />
                                  <span>{option}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {question.options?.map((option) => {
                              const checked = value === option;

                              return (
                                <label
                                  key={option}
                                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${
                                    checked
                                      ? 'border-neutral-900 bg-neutral-900 text-white'
                                      : 'border-neutral-300 text-neutral-700'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    checked={checked}
                                    onChange={() => setRadioAnswer(question.id, option)}
                                    className="sr-only"
                                  />
                                  <span>{option}</span>
                                </label>
                              );
                            })}
                          </div>
                        )
                      ) : null}

                      {question.type === 'text' ? (
                        <div className="flex flex-col gap-1">
                          <textarea
                            value={typeof value === 'string' ? value : ''}
                            onChange={(event) => {
                              const nextValue = question.maxLength
                                ? event.target.value.slice(0, question.maxLength)
                                : event.target.value;
                              setTextAnswer(question.id, nextValue);
                            }}
                            rows={4}
                            className="min-h-[96px] w-full rounded-xl border border-neutral-300 p-3 text-sm text-neutral-900 outline-none focus:border-neutral-500"
                          />
                          <p className="text-right text-xs text-neutral-400">
                            {typeof value === 'string' ? value.length : 0}/
                            {question.maxLength ?? 100}
                          </p>
                        </div>
                      ) : null}

                      {error ? <p className="text-xs text-red-500">{error}</p> : null}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        ))}
      </main>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[600px] -translate-x-1/2 bg-[#f4f4f4] px-2.5 pb-6 pt-2">
        {submitError ? (
          <p className="mb-2 text-center text-xs text-red-500">{submitError}</p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting ? '제출 중...' : 'submit'}
        </button>
      </div>
    </div>
  );
}
