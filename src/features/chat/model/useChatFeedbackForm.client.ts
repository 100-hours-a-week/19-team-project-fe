'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { markChatFeedbackSubmitted, markReportCreateAccepted } from '../lib/reportCreate.client';
import type { ChatFeedbackRequest } from '@/entities/chat';
import { readAccessToken, refreshAuthTokens } from '@/shared/api';

export type FeedbackAnswerKind = 'multi' | 'radio' | 'text';

export type FeedbackQuestion = {
  id: number;
  step: string;
  label: string;
  type: FeedbackAnswerKind;
  maxSelect?: number;
  maxLength?: number;
  options?: string[];
};

export const CHAT_FEEDBACK_QUESTIONS: FeedbackQuestion[] = [
  {
    id: 1,
    step: 'STEP 1',
    label: '요구 자격 중 지원자와 가장 관련 있는 항목 3가지를 선택해주세요.',
    type: 'multi',
    maxSelect: 3,
    options: [
      '특정 기술 스택 숙련도 (예: Java, Spring)',
      '관련 프로젝트 경험',
      '도메인 지식 (예: 핀테크, 이커머스)',
      '협업/커뮤니케이션 경험',
      '문제 해결력/트러블슈팅 경험',
      '대용량 트래픽/성능 최적화 경험',
      '경력 연차',
      '성장 가능성/학습 의지',
    ],
  },
  {
    id: 2,
    step: 'STEP 2',
    label: '요구 경험(회사/팀/도메인) 측면 충족 수준',
    type: 'radio',
    options: ['충족', '부분 충족', '미충족'],
  },
  {
    id: 3,
    step: 'STEP 2',
    label: '관련 경험에 대해 구체적으로 작성해주세요.',
    type: 'text',
    maxLength: 100,
  },
  {
    id: 4,
    step: 'STEP 3',
    label: '핵심 요구역량/프로세스/협업 능력',
    type: 'radio',
    options: ['충족', '부분 충족', '미충족'],
  },
  {
    id: 5,
    step: 'STEP 3',
    label: '핵심 요구역량 관련 보완점/강점을 작성해주세요.',
    type: 'text',
    maxLength: 100,
  },
  {
    id: 6,
    step: 'STEP 4',
    label: '추가 요구사항 (경력 연차)',
    type: 'radio',
    options: ['충족', '부분 충족', '미충족'],
  },
  {
    id: 7,
    step: 'STEP 4',
    label: '추가 요구사항 관련 코멘트를 작성해주세요.',
    type: 'text',
    maxLength: 100,
  },
  {
    id: 8,
    step: 'STEP 3',
    label: '구직자의 이력서에서 드러나는 강점 (2개 선택 필수)',
    type: 'multi',
    maxSelect: 2,
    options: [
      '기술 역량',
      '문제 해결력',
      '커뮤니케이션',
      '프로젝트 경험',
      '성장 가능성',
      '도메인 이해도',
      '협업 능력',
      '자기 표현력(이력서 작성)',
    ],
  },
  {
    id: 9,
    step: 'STEP 3',
    label: '판단 근거(자유서술)',
    type: 'text',
    maxLength: 100,
  },
  {
    id: 10,
    step: 'STEP 4',
    label: '구직자의 이력서에서 보완이 필요한 점 (2개 선택 필수)',
    type: 'multi',
    maxSelect: 2,
    options: [
      '기초 지식 부족',
      '도메인 지식 부족',
      '프로젝트 규모/깊도 부족',
      '성과 정량화 부족',
      '경력 부족/연속성',
      '직무 연관성 부족',
      '포트폴리오 보완 필요',
      '경험 다양성 부족',
    ],
  },
  {
    id: 11,
    step: 'STEP 5',
    label: '보완 필요 영역에 대한 구체 개선안',
    type: 'text',
    maxLength: 100,
  },
  {
    id: 12,
    step: 'STEP 5',
    label: '추가로 제안할 개선 포인트',
    type: 'text',
    maxLength: 100,
  },
  {
    id: 13,
    step: 'STEP 6',
    label: '구직자의 직무 적합도를 선택해주세요.',
    type: 'radio',
    options: ['상 (이 직무에 잘 맞음)', '중 (기본은 갖춤, 보완 필요)', '하 (적합도 낮음)'],
  },
  {
    id: 14,
    step: 'STEP 7',
    label: '구직자의 서류 통과 가능성을 선택해주세요.',
    type: 'radio',
    options: ['상 (통과 가능성 높음)', '중 (보완 시 가능)', '하 (현 상태로는 어려움)'],
  },
  {
    id: 15,
    step: 'STEP 8',
    label: '기타 의견',
    type: 'text',
    maxLength: 300,
  },
];

type ValidationErrors = Record<number, string>;
type Step2ValidationErrors = Record<string, { status?: string; reason?: string }>;
type Step2Evaluations = Record<string, { status: string; reason: string }>;

export function useChatFeedbackForm(chatId: number) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [step2ValidationErrors, setStep2ValidationErrors] = useState<Step2ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step2Evaluations, setStep2Evaluations] = useState<Step2Evaluations>({});
  const [customMultiInputs, setCustomMultiInputs] = useState<Record<number, string>>({});

  const selectedCoreRequirements = useMemo(() => parseCommaValues(answers[1]), [answers]);

  const isComplete = useMemo(() => {
    const staticComplete = CHAT_FEEDBACK_QUESTIONS.every((question) => {
      if (
        question.id === 2 ||
        question.id === 3 ||
        question.id === 4 ||
        question.id === 5 ||
        question.id === 6 ||
        question.id === 7
      ) {
        return true;
      }
      return hasValidValue(question, answers[question.id]);
    });
    if (!staticComplete) return false;

    return selectedCoreRequirements.every((requirement) => {
      const status = step2Evaluations[requirement]?.status?.trim() ?? '';
      const reason = step2Evaluations[requirement]?.reason?.trim() ?? '';
      return Boolean(status && reason);
    });
  }, [answers, selectedCoreRequirements, step2Evaluations]);

  const setTextAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setValidationErrors((prev) => ({ ...prev, [questionId]: '' }));
  };

  const setRadioAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setValidationErrors((prev) => ({ ...prev, [questionId]: '' }));
  };

  const toggleMultiAnswer = (questionId: number, value: string, maxSelect: number) => {
    let nextSelectedForQuestion: string[] = [];
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId])
        ? (prev[questionId] as string[])
        : parseCommaValues(prev[questionId]);
      const isOtherOption = value.startsWith('기타:');
      const isSelected = isOtherOption
        ? current.some((item) => item.startsWith('기타:'))
        : current.includes(value);
      const next = isSelected
        ? isOtherOption
          ? current.filter((item) => !item.startsWith('기타:'))
          : current.filter((item) => item !== value)
        : current.length >= maxSelect
          ? current
          : [...current, value];
      nextSelectedForQuestion = next;
      return { ...prev, [questionId]: next };
    });
    setValidationErrors((prev) => ({ ...prev, [questionId]: '' }));
    if (questionId === 1) {
      setStep2ValidationErrors({});
      setStep2Evaluations((prev) => {
        const nextMap: Step2Evaluations = {};
        for (const requirement of nextSelectedForQuestion) {
          nextMap[requirement] = prev[requirement] ?? { status: '', reason: '' };
        }
        return nextMap;
      });
    }
  };

  const setCustomMultiInput = (questionId: number, value: string) => {
    setCustomMultiInputs((prev) => ({ ...prev, [questionId]: value }));
  };

  const confirmCustomMultiAnswer = (questionId: number, maxSelect: number): boolean => {
    const raw = customMultiInputs[questionId] ?? '';
    const trimmed = raw.trim();
    if (!trimmed) return false;

    let confirmed = false;
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId])
        ? (prev[questionId] as string[])
        : parseCommaValues(prev[questionId]);
      const withoutOther = current.filter((item) => !item.startsWith('기타:'));
      const nextValue = `기타: ${trimmed}`;
      const canInsert =
        withoutOther.length < maxSelect || current.some((item) => item.startsWith('기타:'));
      if (!canInsert) return prev;
      confirmed = true;
      return { ...prev, [questionId]: [...withoutOther, nextValue] };
    });

    if (confirmed) {
      setValidationErrors((prev) => ({ ...prev, [questionId]: '' }));
    }

    return confirmed;
  };

  const setStep2Status = (requirement: string, status: string) => {
    setStep2Evaluations((prev) => ({
      ...prev,
      [requirement]: {
        status,
        reason: prev[requirement]?.reason ?? '',
      },
    }));
    setStep2ValidationErrors((prev) => ({
      ...prev,
      [requirement]: {
        ...prev[requirement],
        status: '',
      },
    }));
  };

  const setStep2Reason = (requirement: string, reason: string, maxLength = 100) => {
    setStep2Evaluations((prev) => ({
      ...prev,
      [requirement]: {
        status: prev[requirement]?.status ?? '',
        reason: reason.slice(0, maxLength),
      },
    }));
    setStep2ValidationErrors((prev) => ({
      ...prev,
      [requirement]: {
        ...prev[requirement],
        reason: '',
      },
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setSubmitError(null);
    const nextValidationErrors: ValidationErrors = {};
    const nextStep2ValidationErrors: Step2ValidationErrors = {};

    for (const question of CHAT_FEEDBACK_QUESTIONS) {
      if (
        question.id === 2 ||
        question.id === 3 ||
        question.id === 4 ||
        question.id === 5 ||
        question.id === 6 ||
        question.id === 7
      ) {
        continue;
      }

      if (!hasValidValue(question, answers[question.id])) {
        nextValidationErrors[question.id] =
          question.type === 'multi'
            ? `${question.maxSelect ?? 1}개 선택은 필수입니다.`
            : '필수 입력 항목입니다.';
      }
    }

    for (const requirement of selectedCoreRequirements) {
      const status = step2Evaluations[requirement]?.status?.trim() ?? '';
      const reason = step2Evaluations[requirement]?.reason?.trim() ?? '';
      if (!status || !reason) {
        nextStep2ValidationErrors[requirement] = {
          status: status ? '' : '필수 선택 항목입니다.',
          reason: reason ? '' : '필수 입력 항목입니다.',
        };
      }
    }

    const hasValidationError =
      Object.keys(nextValidationErrors).length > 0 ||
      Object.keys(nextStep2ValidationErrors).length > 0;

    if (hasValidationError) {
      setValidationErrors(nextValidationErrors);
      setStep2ValidationErrors(nextStep2ValidationErrors);
      setSubmitError('모든 설문 문항은 필수입니다. 미입력 항목을 확인해 주세요.');
      return;
    }

    setValidationErrors({});
    setStep2ValidationErrors({});
    setIsSubmitting(true);

    const payload: ChatFeedbackRequest = _buildPayload({
      questions: CHAT_FEEDBACK_QUESTIONS,
      answers,
      selectedCoreRequirements,
      step2Evaluations,
      preferVerboseMultiLabels: false,
    });
    const retryPayload: ChatFeedbackRequest = _buildPayload({
      questions: CHAT_FEEDBACK_QUESTIONS,
      answers,
      selectedCoreRequirements,
      step2Evaluations,
      preferVerboseMultiLabels: true,
    });

    sendFeedbackInBackground(chatId, payload, retryPayload);
    setIsSubmitting(false);
    router.replace('/chat');
  };

  return {
    questions: CHAT_FEEDBACK_QUESTIONS,
    answers,
    validationErrors,
    step2ValidationErrors,
    submitError,
    isSubmitting,
    isComplete,
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
  };
}

async function closeChatInBackground(chatId: number): Promise<boolean> {
  const url = `/bff/chat/${chatId}`;

  try {
    const response = await fetchWithAuthRefresh(url, {
      method: 'PATCH',
      credentials: 'include',
      keepalive: true,
    });
    if (!response?.ok) return false;
    const body = (await response.json().catch(() => null)) as { code?: string } | null;
    return body?.code === 'OK' || body?.code === 'UPDATED';
  } catch {
    return false;
  }
}

function sendFeedbackInBackground(
  chatId: number,
  payload: ChatFeedbackRequest,
  retryPayload: ChatFeedbackRequest,
) {
  const url = `/bff/chat/${chatId}/feedback`;

  const postFeedback = async (requestPayload: ChatFeedbackRequest) => {
    const response = await fetchWithAuthRefresh(url, {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });
    if (!response) return { ok: false, code: '' };
    const data = (await response.json().catch(() => null)) as { code?: string } | null;
    return { ok: response.ok && data?.code === 'CREATED', code: data?.code ?? '' };
  };

  void (async () => {
    const closed = await closeChatInBackground(chatId);
    if (!closed) return;

    const first = await postFeedback(payload);
    if (first.ok) {
      markChatFeedbackSubmitted(chatId);
      markReportCreateAccepted();
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('reportCreateSuccess', 'true');
      }
      return;
    }

    if (first.code !== 'FEEDBACK_ANSWER_INVALID') {
      return;
    }

    const second = await postFeedback(retryPayload);
    if (second.ok) {
      markChatFeedbackSubmitted(chatId);
      markReportCreateAccepted();
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('reportCreateSuccess', 'true');
      }
    }
  })();
}

async function fetchWithAuthRefresh(
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<Response | null> {
  const requestWithToken = (token?: string | null) => {
    const headers = new Headers(init.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      headers.delete('Authorization');
    }

    return fetch(input, {
      ...init,
      headers,
    }).catch(() => null);
  };

  const first = await requestWithToken(readAccessToken());
  if (!first || first.status !== 401) return first;

  const refreshed = await refreshAuthTokens().catch(() => false);
  if (!refreshed) return first;

  return requestWithToken(readAccessToken());
}

function parseCommaValues(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasValidValue(
  question: FeedbackQuestion,
  rawValue: string | string[] | undefined,
): boolean {
  if (question.type === 'multi') {
    const values = parseCommaValues(rawValue);
    return values.length === question.maxSelect;
  }

  if (question.type === 'radio') {
    return typeof rawValue === 'string' && rawValue.trim().length > 0;
  }

  return typeof rawValue === 'string' && rawValue.trim().length > 0;
}

function normalizeAnswerValue(
  question: FeedbackQuestion,
  rawValue: string | string[] | undefined,
  preferVerboseMultiLabels = false,
): string {
  if (question.type === 'multi') {
    return parseCommaValues(rawValue)
      .map((item) => normalizeChoiceValue(question.id, item, preferVerboseMultiLabels))
      .join(',');
  }

  return typeof rawValue === 'string' ? rawValue.trim() : '';
}

function normalizeHighMidLowValue(rawValue: string | string[] | undefined): string {
  if (typeof rawValue !== 'string') return '';
  const trimmed = rawValue.trim();
  if (trimmed.startsWith('상')) return '상';
  if (trimmed.startsWith('중')) return '중';
  if (trimmed.startsWith('하')) return '하';
  return trimmed;
}

function getStep2StatusByOrder(
  selectedRequirements: string[],
  evaluations: Step2Evaluations,
  index: number,
): string {
  const requirement = selectedRequirements[index];
  if (!requirement) return '';
  return evaluations[requirement]?.status?.trim() ?? '';
}

function getStep2ReasonByOrder(
  selectedRequirements: string[],
  evaluations: Step2Evaluations,
  index: number,
): string {
  const requirement = selectedRequirements[index];
  if (!requirement) return '';
  return evaluations[requirement]?.reason?.trim() ?? '';
}

function clampAnswerValueByQuestion(questionId: number, value: string): string {
  const textMaxLengthByQuestionId: Record<number, number> = {
    3: 100,
    5: 100,
    7: 100,
    9: 100,
    11: 100,
    12: 100,
    15: 300,
  };
  const maxLength = textMaxLengthByQuestionId[questionId];
  if (!maxLength) return value;
  return value.slice(0, maxLength);
}

function normalizeChoiceValue(
  questionId: number,
  rawItem: string,
  preferVerboseMultiLabels = false,
): string {
  const item = rawItem.trim();
  if (!item) return item;
  if (item.startsWith('기타:')) return '기타';

  if (questionId === 1) {
    const canonicalMap: Record<string, string> = {
      '특정 기술 스택 숙련도 (예: Java, Spring)': '특정 기술 스택 숙련도',
      '특정 기술 스택 숙련도 (예: Next.js)': '특정 기술 스택 숙련도',
      '도메인 지식 (예: 핀테크, 이커머스)': '도메인 지식',
      '관련 프로젝트경험': '관련 프로젝트 경험',
      '경력 프로젝트경험': '관련 프로젝트 경험',
      '경력 프로젝트 경험': '관련 프로젝트 경험',
    };
    const canonical = canonicalMap[item] ?? item;
    if (!preferVerboseMultiLabels) return canonical;

    const verboseMap: Record<string, string> = {
      '특정 기술 스택 숙련도': '특정 기술 스택 숙련도 (예: Java, Spring)',
      '도메인 지식': '도메인 지식 (예: 핀테크, 이커머스)',
    };
    return verboseMap[canonical] ?? canonical;
  }

  if (questionId === 8) {
    const map: Record<string, string> = {
      '자기 표현력(이력서 작성)': '자기 소개서(이력서) 작성',
    };
    return map[item] ?? item;
  }

  if (questionId === 10) {
    const map: Record<string, string> = {
      경력부족연속성: '경력 공백/연속성',
      '경력 부족/연속성': '경력 공백/연속성',
      '프로젝트 규모/복잡도 부족': '프로젝트 규모/깊도 부족',
      '포트폴리오 보완 필요': '포트폴리오 완성도 낮음',
    };
    return map[item] ?? item;
  }

  return item;
}

type BuildPayloadParams = {
  questions: FeedbackQuestion[];
  answers: Record<number, string | string[]>;
  selectedCoreRequirements: string[];
  step2Evaluations: Step2Evaluations;
  preferVerboseMultiLabels: boolean;
};

function _buildPayload(params: BuildPayloadParams): {
  answers: Array<{ question_id: number; answer_value: string }>;
} {
  return {
    answers: params.questions.map((question) => ({
      question_id: question.id,
      answer_value: clampAnswerValueByQuestion(
        question.id,
        question.id === 2
          ? getStep2StatusByOrder(params.selectedCoreRequirements, params.step2Evaluations, 0)
          : question.id === 3
            ? getStep2ReasonByOrder(params.selectedCoreRequirements, params.step2Evaluations, 0)
            : question.id === 4
              ? getStep2StatusByOrder(params.selectedCoreRequirements, params.step2Evaluations, 1)
              : question.id === 5
                ? getStep2ReasonByOrder(params.selectedCoreRequirements, params.step2Evaluations, 1)
                : question.id === 6
                  ? getStep2StatusByOrder(
                      params.selectedCoreRequirements,
                      params.step2Evaluations,
                      2,
                    )
                  : question.id === 7
                    ? getStep2ReasonByOrder(
                        params.selectedCoreRequirements,
                        params.step2Evaluations,
                        2,
                      )
                    : question.id === 13 || question.id === 14
                      ? normalizeHighMidLowValue(params.answers[question.id])
                      : normalizeAnswerValue(
                          question,
                          params.answers[question.id],
                          params.preferVerboseMultiLabels,
                        ),
      ),
    })),
  };
}
