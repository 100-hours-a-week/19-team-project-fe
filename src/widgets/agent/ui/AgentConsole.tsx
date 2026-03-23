'use client';

import { Fragment, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import type { AgentMessage, AgentSseEvent } from '@/entities/agent';
import { useAuthStatus } from '@/entities/auth';
import { getExperts } from '@/entities/experts';
import {
  getAgentSessions,
  createAgentSession,
  getAgentSessionMessages,
  streamAgentReply,
  updateAgentMessageFeedback,
} from '@/features/agent';
import charMain from '@/shared/icons/char_ai.png';

type AgentConsoleProps = {
  compact?: boolean;
};

type UiMessage = {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
  feedback?: boolean | null;
  cards?: MentorCard[];
};

type MentorCard = {
  userId?: number;
  name: string;
  company?: string;
  stack?: string;
  matchRate?: string;
};

function dedupeMentorCards(cards: MentorCard[]): MentorCard[] {
  const seen = new Set<string>();
  const deduped: MentorCard[] = [];

  cards.forEach((card) => {
    const key = `${card.userId ?? ''}|${card.name.trim().toLowerCase()}|${card.company ?? ''}|${
      card.stack ?? ''
    }|${card.matchRate ?? ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(card);
  });

  return deduped;
}

function sanitizeCardText(value: string): string {
  return value.replace(/\*\*/g, '').trim();
}

function sanitizeCardName(value: string): string {
  return sanitizeCardText(value)
    .replace(/^\s*(?:\d+\s*[.)]?|[0-9]️⃣|️⃣)\s*/u, '')
    .trim();
}

function toUiMessage(message: AgentMessage): UiMessage {
  const role =
    message.role === 'USER' || message.role === 'ASSISTANT' ? message.role : ('SYSTEM' as const);
  const cardsFromMetadata = normalizeMentorCards(message.metadata);

  return {
    id: String(message.id),
    role,
    content: message.content,
    createdAt: message.createdAt,
    feedback: message.feedback,
    cards: cardsFromMetadata.length > 0 ? cardsFromMetadata : undefined,
  };
}

function parseMessageId(rawId: string): number | null {
  const parsed = Number(rawId);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function extractSessionIdFromEvent(event: AgentSseEvent): string | null {
  const { data } = event;

  if (typeof data === 'string') {
    const trimmed = data.trim();
    return trimmed || null;
  }

  if (!data || typeof data !== 'object') return null;

  const candidate = data as { session_id?: unknown; sessionId?: unknown };
  const raw = candidate.session_id ?? candidate.sessionId;
  return typeof raw === 'string' && raw ? raw : null;
}

function extractTextChunkFromEvent(event: AgentSseEvent): string {
  const { data } = event;

  if (typeof data === 'string') {
    return data;
  }

  if (!data || typeof data !== 'object') return '';

  const candidate = data as {
    text?: unknown;
    content?: unknown;
    message?: unknown;
    chunk?: unknown;
  };

  const raw = candidate.text ?? candidate.content ?? candidate.message ?? candidate.chunk;
  return typeof raw === 'string' ? raw : '';
}

function toDisplayText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => toDisplayText(item))
      .filter(Boolean)
      .join(', ');
  }
  return '';
}

function formatCardsEvent(data: unknown): string {
  if (!data || typeof data !== 'object') return '';

  const payload = data as { cards?: unknown };
  const cards = Array.isArray(payload.cards) ? payload.cards : Array.isArray(data) ? data : [];
  if (cards.length === 0) return '';

  const lines = cards.map((card, index) => {
    if (!card || typeof card !== 'object') return `${index + 1}. 추천 멘토`;

    const candidate = card as Record<string, unknown>;
    const name =
      toDisplayText(candidate.nickname) ||
      toDisplayText(candidate.name) ||
      toDisplayText(candidate.expert_name) ||
      toDisplayText(candidate.expertName) ||
      `추천 멘토 ${index + 1}`;
    const company =
      toDisplayText(candidate.company_name) ||
      toDisplayText(candidate.companyName) ||
      toDisplayText(candidate.company);
    const stack =
      toDisplayText(candidate.tech_stack) ||
      toDisplayText(candidate.techStack) ||
      toDisplayText(candidate.stack) ||
      toDisplayText(candidate.skills);
    const match =
      toDisplayText(candidate.match_score) ||
      toDisplayText(candidate.matchScore) ||
      toDisplayText(candidate.match_rate) ||
      toDisplayText(candidate.matchRate);

    const segments = [name, company, stack, match ? `매칭 ${match}%` : ''].filter(Boolean);
    return `${index + 1}. ${segments.join(' | ')}`;
  });

  return `추천 멘토\n${lines.join('\n')}`;
}

function normalizeMentorCards(data: unknown): MentorCard[] {
  if (!data || typeof data !== 'object') return [];

  const payload = data as {
    cards?: unknown;
    metadata?: unknown;
    meta_data?: unknown;
  };
  const metadata =
    payload.metadata && typeof payload.metadata === 'object'
      ? (payload.metadata as { cards?: unknown })
      : payload.meta_data && typeof payload.meta_data === 'object'
        ? (payload.meta_data as { cards?: unknown })
        : null;
  const cards = Array.isArray(payload.cards)
    ? payload.cards
    : Array.isArray(metadata?.cards)
      ? metadata.cards
      : Array.isArray(data)
        ? data
        : [];
  if (cards.length === 0) return [];

  const normalized: MentorCard[] = [];

  cards.forEach((card, index) => {
    if (!card || typeof card !== 'object') return;
    const candidate = card as Record<string, unknown>;

    const rawMetadata =
      candidate.metadata && typeof candidate.metadata === 'object'
        ? (candidate.metadata as Record<string, unknown>)
        : candidate.meta_data && typeof candidate.meta_data === 'object'
          ? (candidate.meta_data as Record<string, unknown>)
          : null;

    const rawUserId =
      rawMetadata?.user_id ??
      rawMetadata?.userId ??
      candidate.user_id ??
      candidate.userId ??
      candidate.expert_id ??
      candidate.expertId;
    const userId = typeof rawUserId === 'number' ? rawUserId : Number(rawUserId);
    const normalizedUserId = Number.isNaN(userId) || userId <= 0 ? undefined : userId;

    const name =
      toDisplayText(candidate.nickname) ||
      toDisplayText(candidate.name) ||
      toDisplayText(candidate.expert_name) ||
      toDisplayText(candidate.expertName) ||
      `추천 멘토 ${index + 1}`;
    const company =
      toDisplayText(candidate.company_name) ||
      toDisplayText(candidate.companyName) ||
      toDisplayText(candidate.company) ||
      undefined;
    const stack =
      toDisplayText(candidate.tech_stack) ||
      toDisplayText(candidate.techStack) ||
      toDisplayText(candidate.stack) ||
      toDisplayText(candidate.skills) ||
      undefined;
    const matchRate =
      toDisplayText(candidate.match_score) ||
      toDisplayText(candidate.matchScore) ||
      toDisplayText(candidate.match_rate) ||
      toDisplayText(candidate.matchRate) ||
      undefined;

    normalized.push({ userId: normalizedUserId, name, company, stack, matchRate });
  });

  return normalized;
}

function parseMentorCardsFromText(content: string): MentorCard[] {
  const lines = content.split('\n').map((line) => line.trim());
  const cards: MentorCard[] = [];
  const mentorSectionStart = lines.findIndex(
    (line) => line === '추천 멘토' || line === '추천 현직자' || line === '추천 전문가',
  );
  const candidateLines = mentorSectionStart >= 0 ? lines.slice(mentorSectionStart + 1) : [];
  if (candidateLines.length === 0) return [];

  for (const line of candidateLines) {
    const match = line.match(/^((?:\d+|[0-9]️⃣))\s*(.+)$/);
    if (!match) continue;

    const body = match[2] ?? '';
    // Fallback parser should only treat explicit mentor-card rows as cards.
    if (!body.includes('|') && !body.includes('매칭')) continue;

    const segments = body
      .split('|')
      .map((segment) => segment.trim())
      .filter(Boolean);
    if (segments.length === 0) continue;

    const name = segments[0] ?? '';
    if (!name) continue;

    const matchSegment = segments.find((segment) => segment.includes('매칭'));
    const matchRate = matchSegment?.match(/(\d{1,3})/)?.[1];
    const nonMatchSegments = segments
      .slice(1)
      .filter((segment) => !segment.includes('매칭') && !segment.startsWith('→'));
    const company = nonMatchSegments[0];
    const stack =
      nonMatchSegments.length > 1 ? nonMatchSegments.slice(1).join(', ') : nonMatchSegments[0];

    cards.push({
      name: sanitizeCardName(name),
      company: company ? sanitizeCardText(company) : undefined,
      stack: stack ? sanitizeCardText(stack) : undefined,
      matchRate,
    });
  }

  return dedupeMentorCards(cards);
}

function stripMentorCardLines(content: string): string {
  const lines = content.split('\n');
  const kept: string[] = [];

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      kept.push(rawLine);
      return;
    }

    // Remove card-like list rows and follow-up explanation rows.
    if (isNumberedLine(line)) return;
    if (line.startsWith('→')) return;
    if (line.includes('매칭') && /^\s*매칭\s*\d{1,3}%\s*$/u.test(line)) return;

    kept.push(rawLine);
  });

  return kept
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatConditionsEvent(data: unknown): string {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return '';
  const entries = Object.entries(data as Record<string, unknown>).filter(
    ([, value]) => value !== null && value !== undefined,
  );
  if (entries.length === 0) return '';

  return `추천 조건\n${entries.map(([key, value]) => `- ${key}: ${toDisplayText(value)}`).join('\n')}`;
}

function extractEventReadableChunk(event: AgentSseEvent): {
  text: string;
  asBlock: boolean;
  cards: MentorCard[];
} {
  if (event.event === 'text') {
    return { text: extractTextChunkFromEvent(event), asBlock: false, cards: [] };
  }

  if (event.event === 'cards') {
    return {
      text: formatCardsEvent(event.data),
      asBlock: true,
      cards: normalizeMentorCards(event.data),
    };
  }

  if (event.event === 'conditions') {
    return { text: formatConditionsEvent(event.data), asBlock: true, cards: [] };
  }

  if (event.event === 'intent') {
    const intentText =
      typeof event.data === 'string'
        ? event.data
        : toDisplayText((event.data as { intent?: unknown } | null)?.intent);
    return { text: intentText ? `의도: ${intentText}` : '', asBlock: true, cards: [] };
  }

  if (event.event === 'error') {
    return { text: extractTextChunkFromEvent(event), asBlock: true, cards: [] };
  }

  return { text: '', asBlock: false, cards: [] };
}

function renderInlineTokens(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, partIndex) => {
    const isBold = part.startsWith('**') && part.endsWith('**') && part.length > 4;
    if (isBold) {
      return <strong key={`${keyPrefix}-part-${partIndex}`}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={`${keyPrefix}-part-${partIndex}`}>{part}</Fragment>;
  });
}

function isNumberedLine(line: string): RegExpMatchArray | null {
  return line.match(/^((?:\d+|[0-9]️⃣))\s*[.)]?\s+(.+)$/);
}

function isBulletLine(line: string): RegExpMatchArray | null {
  return line.match(/^[-•]\s+(.+)$/);
}

function renderFormattedMessage(content: string, tone: 'assistant' | 'user' = 'assistant') {
  const lines = content.split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;
  const textColorClass = tone === 'user' ? 'text-white' : 'text-[#20324a]';
  const headingColorClass = tone === 'user' ? 'text-white' : 'text-[#1f2f46]';

  while (index < lines.length) {
    const rawLine = lines[index] ?? '';
    const line = rawLine.trim();

    if (!line) {
      blocks.push(<div key={`spacer-${index}`} className="h-2" />);
      index += 1;
      continue;
    }

    if (line === '추천 멘토' || line === '추천 조건' || line.startsWith('의도:')) {
      blocks.push(
        <p key={`heading-${index}`} className={`mb-1 text-sm font-semibold ${headingColorClass}`}>
          {renderInlineTokens(line, `heading-${index}`)}
        </p>,
      );
      index += 1;
      continue;
    }

    const numbered = isNumberedLine(line);
    if (numbered) {
      const items: Array<{ marker: string; body: string }> = [];
      let cursor = index;
      while (cursor < lines.length) {
        const matched = isNumberedLine((lines[cursor] ?? '').trim());
        if (!matched) break;
        items.push({ marker: matched[1] ?? '', body: matched[2] ?? '' });
        cursor += 1;
      }
      blocks.push(
        <ol key={`ol-${index}`} className="my-1 space-y-2">
          {items.map((item, itemIndex) => (
            <li
              key={`ol-item-${index}-${itemIndex}`}
              className={`text-sm leading-relaxed ${textColorClass}`}
            >
              <span className="mr-1 font-semibold">{item.marker}</span>
              {renderInlineTokens(item.body, `ol-item-${index}-${itemIndex}`)}
            </li>
          ))}
        </ol>,
      );
      index = cursor;
      continue;
    }

    const bullet = isBulletLine(line);
    if (bullet) {
      const items: string[] = [];
      let cursor = index;
      while (cursor < lines.length) {
        const matched = isBulletLine((lines[cursor] ?? '').trim());
        if (!matched) break;
        items.push(matched[1] ?? '');
        cursor += 1;
      }
      blocks.push(
        <ul key={`ul-${index}`} className="my-1 list-disc space-y-1 pl-4">
          {items.map((item, itemIndex) => (
            <li
              key={`ul-item-${index}-${itemIndex}`}
              className={`text-sm leading-relaxed ${textColorClass}`}
            >
              {renderInlineTokens(item, `ul-item-${index}-${itemIndex}`)}
            </li>
          ))}
        </ul>,
      );
      index = cursor;
      continue;
    }

    blocks.push(
      <p key={`p-${index}`} className={`text-sm leading-relaxed ${textColorClass}`}>
        {renderInlineTokens(line, `p-${index}`)}
      </p>,
    );
    index += 1;
  }

  return blocks;
}

export default function AgentConsole({ compact = false }: AgentConsoleProps) {
  const router = useRouter();
  const { status: authStatus } = useAuthStatus();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackSubmittingMap, setFeedbackSubmittingMap] = useState<Record<number, boolean>>({});

  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  const isNearBottom = useCallback((element: HTMLDivElement, threshold = 80) => {
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    return distanceFromBottom <= threshold;
  }, []);

  const appendSystemMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `system-${Date.now()}`,
        role: 'SYSTEM',
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const loadMessages = useCallback(
    async (sessionId: string) => {
      setIsLoadingMessages(true);
      setErrorMessage(null);

      try {
        const data = await getAgentSessionMessages(sessionId);
        setMessages((data.messages ?? []).map(toUiMessage));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'AGENT_MESSAGES_FAILED';
        setErrorMessage(message);
        appendSystemMessage('메시지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [appendSystemMessage],
  );

  const bootstrapSessions = useCallback(async () => {
    if (authStatus !== 'authed') return;

    setErrorMessage(null);

    try {
      const list = await getAgentSessions();
      let nextSessions = list;

      if (nextSessions.length === 0) {
        const created = await createAgentSession();
        nextSessions = [created];
      }

      const fallbackSessionId = nextSessions[0]?.sessionId ?? null;
      setActiveSessionId(fallbackSessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AGENT_SESSIONS_FAILED';
      setErrorMessage(message);
      appendSystemMessage('세션을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');
    }
  }, [appendSystemMessage, authStatus]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || authStatus !== 'authed') return;

    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const created = await createAgentSession();
        setActiveSessionId(created.sessionId);
        sessionId = created.sessionId;
      } catch {
        appendSystemMessage('세션 생성에 실패했습니다. 다시 시도해 주세요.');
        return;
      }
    }

    const userMessage: UiMessage = {
      id: `user-${Date.now()}`,
      role: 'USER',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const assistantMessageId = `assistant-${Date.now()}`;

    setInput('');
    setIsStreaming(true);
    setErrorMessage(null);
    shouldAutoScrollRef.current = true;
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantMessageId,
        role: 'ASSISTANT',
        content: '',
        createdAt: new Date().toISOString(),
      },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAgentReply(
        {
          session_id: sessionId,
          message: trimmed,
          top_k: 3,
        },
        {
          signal: controller.signal,
          onEvent: (event) => {
            if (event.event === 'session') {
              const eventSessionId = extractSessionIdFromEvent(event);
              if (eventSessionId) {
                sessionId = eventSessionId;
                setActiveSessionId(eventSessionId);
              }
              return;
            }

            const { text, asBlock, cards } = extractEventReadableChunk(event);
            if (!text && cards.length === 0) return;

            if (event.event === 'error') {
              appendSystemMessage(text || '에이전트 응답 중 오류가 발생했습니다.');
              return;
            }

            setMessages((prev) =>
              prev.map((message) => {
                if (message.id !== assistantMessageId) return message;
                const nextContent = text
                  ? asBlock && message.content
                    ? `${message.content}\n${text}`
                    : `${message.content}${text}`
                  : message.content;
                return {
                  ...message,
                  content: nextContent,
                  cards: cards.length > 0 ? cards : message.cards,
                };
              }),
            );
          },
        },
      );

      if (sessionId) {
        const sessionMessages = await getAgentSessionMessages(sessionId);
        setMessages((sessionMessages.messages ?? []).map(toUiMessage));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AGENT_REPLY_FAILED';
      setErrorMessage(message);
      appendSystemMessage('에이전트 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setMessages((prev) => prev.filter((message) => message.id !== assistantMessageId));
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
    }
  }, [activeSessionId, appendSystemMessage, authStatus, input, isStreaming]);

  const handleMentorCardClick = useCallback(
    async (card: MentorCard) => {
      if (card.userId) {
        router.push(`/experts/${card.userId}`);
        return;
      }

      try {
        const response = await getExperts({ keyword: card.name, size: 9 });
        const exact =
          response.experts.find((expert) => expert.nickname === card.name) ?? response.experts[0];
        if (!exact) {
          setErrorMessage(
            '추천 현직자 정보를 찾지 못했습니다. 검색 페이지에서 다시 확인해 주세요.',
          );
          return;
        }
        router.push(`/experts/${exact.user_id}`);
      } catch {
        setErrorMessage('추천 현직자 이동에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
    },
    [router],
  );

  const handleMessageFeedback = useCallback(
    async (messageId: number, next: boolean) => {
      if (feedbackSubmittingMap[messageId]) return;

      let previousFeedback: boolean | null = null;
      setMessages((prev) =>
        prev.map((message) => {
          const currentId = parseMessageId(message.id);
          if (currentId !== messageId) return message;
          previousFeedback = typeof message.feedback === 'boolean' ? message.feedback : null;
          const nextFeedback = previousFeedback === next ? null : next;
          return {
            ...message,
            feedback: nextFeedback,
          };
        }),
      );
      setFeedbackSubmittingMap((prev) => ({ ...prev, [messageId]: true }));

      try {
        const resolvedFeedback = previousFeedback === next ? null : next;
        const response = await updateAgentMessageFeedback(messageId, {
          feedback: resolvedFeedback,
        });
        setMessages((prev) =>
          prev.map((message) => {
            const currentId = parseMessageId(message.id);
            if (currentId !== messageId) return message;
            return {
              ...message,
              feedback: response.feedback,
            };
          }),
        );
      } catch (error) {
        setMessages((prev) =>
          prev.map((message) => {
            const currentId = parseMessageId(message.id);
            if (currentId !== messageId) return message;
            return {
              ...message,
              feedback: previousFeedback,
            };
          }),
        );
        setErrorMessage(
          error instanceof Error ? error.message : '메시지 평가 저장에 실패했습니다.',
        );
      } finally {
        setFeedbackSubmittingMap((prev) => ({ ...prev, [messageId]: false }));
      }
    },
    [feedbackSubmittingMap],
  );

  useEffect(() => {
    void bootstrapSessions();
  }, [bootstrapSessions]);

  useEffect(() => {
    if (!activeSessionId || authStatus !== 'authed') return;
    void loadMessages(activeSessionId);
  }, [activeSessionId, authStatus, loadMessages]);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    endRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, [messages.length, isStreaming]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sectionClassName = compact
    ? 'flex h-full min-h-0 flex-col px-2'
    : 'flex flex-1 flex-col px-2.5 pb-[calc(var(--app-footer-height)+20px)] pt-[calc(var(--app-header-height)+20px)]';

  if (authStatus !== 'authed') {
    return (
      <section className={sectionClassName}>
        <div className="rounded-3xl border border-[#d7dfeb] bg-white px-4 py-8 text-center text-sm text-[#5f6f86]">
          에이전트 기능은 로그인 후 이용할 수 있습니다.
        </div>
      </section>
    );
  }

  return (
    <section className={sectionClassName}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-[#dbe3ee] bg-[#f7f9fc]">
        <div
          ref={listRef}
          onScroll={(event) => {
            shouldAutoScrollRef.current = isNearBottom(event.currentTarget);
          }}
          className="scrollbar-hide flex-1 overflow-y-auto px-3 py-4"
        >
          {isLoadingMessages ? (
            <p className="text-sm text-[#6f8098]">메시지를 불러오는 중...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-[#6f8098]">메시지를 입력하면 Agent가 답변을 시작합니다.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <div key={message.id}>
                  {(() => {
                    const parsedCards = dedupeMentorCards(
                      message.cards && message.cards.length > 0
                        ? message.cards
                        : message.role === 'ASSISTANT'
                          ? parseMentorCardsFromText(message.content)
                          : [],
                    );
                    const renderCardsOnly = message.role === 'ASSISTANT' && parsedCards.length > 0;
                    const assistantContent = renderCardsOnly
                      ? stripMentorCardLines(message.content)
                      : message.content;

                    return (
                      <>
                        {message.role === 'ASSISTANT' ? (
                          assistantContent ? (
                            <div className="mr-auto flex max-w-[92%] items-end gap-2">
                              <Image
                                src={charMain}
                                alt="AI 에이전트"
                                width={28}
                                height={28}
                                className="h-7 w-7 shrink-0 rounded-full border border-[#dbe3ee] bg-white"
                              />
                              <div className="w-fit max-w-[78%] whitespace-pre-wrap break-words rounded-2xl bg-white px-3 py-2 text-sm leading-relaxed text-[#20324a]">
                                {assistantContent
                                  ? renderFormattedMessage(assistantContent, 'assistant')
                                  : isStreaming
                                    ? '...'
                                    : ''}
                              </div>
                            </div>
                          ) : null
                        ) : (
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                              message.role === 'USER'
                                ? 'ml-auto w-fit max-w-[78%] whitespace-pre-wrap break-words bg-[#35558b] text-white'
                                : 'mx-auto bg-[#fff4e8] text-[#8a5c2f]'
                            }`}
                          >
                            {renderFormattedMessage(message.content, 'user')}
                          </div>
                        )}
                        {message.role === 'ASSISTANT' && parsedCards.length > 0 ? (
                          <div className="ml-10 mt-4 flex max-w-[64%] flex-col gap-4">
                            {parsedCards.map((card, cardIndex) =>
                              (() => {
                                const stackItems = (card.stack ?? '')
                                  .split(/[|,]/)
                                  .map((item) => item.trim())
                                  .filter(Boolean)
                                  .reduce<string[]>((acc, item) => {
                                    if (!acc.includes(item)) acc.push(item);
                                    return acc;
                                  }, [])
                                  .slice(0, 5);
                                const heading = sanitizeCardName(card.name);
                                const stackText =
                                  stackItems.length > 0 ? stackItems.join(', ') : '-';

                                return (
                                  <button
                                    key={`${message.id}-${card.userId ?? card.name}-${cardIndex}`}
                                    type="button"
                                    onClick={() => {
                                      void handleMentorCardClick(card);
                                    }}
                                    className="flex w-full items-stretch overflow-hidden rounded-2xl bg-white text-left"
                                  >
                                    <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
                                      <span className="h-14 w-[3px] shrink-0 rounded-sm bg-[var(--color-primary-main)]" />
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-bold leading-tight text-[#111827]">
                                          {heading}
                                        </p>
                                        <p className="mt-1 truncate text-xs font-semibold leading-tight text-[#111827]">
                                          {stackText}
                                        </p>
                                        <p className="mt-1 text-xs font-semibold leading-tight text-[#111827]">
                                          {card.matchRate ? `매칭 ${card.matchRate}%` : '추천'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex w-12 shrink-0 items-center justify-center bg-[var(--color-primary-main)]">
                                      <svg
                                        data-slot="icon"
                                        fill="none"
                                        strokeWidth="1.8"
                                        stroke="white"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                        aria-hidden="true"
                                        className="h-5 w-5"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                                        />
                                      </svg>
                                    </div>
                                  </button>
                                );
                              })(),
                            )}
                          </div>
                        ) : null}
                        {(() => {
                          if (message.role !== 'ASSISTANT') return null;
                          const messageId = parseMessageId(message.id);
                          if (!messageId) return null;

                          const isSubmittingFeedback = feedbackSubmittingMap[messageId] ?? false;
                          const feedback = message.feedback ?? null;

                          return (
                            <div className="ml-10 mt-3 flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  void handleMessageFeedback(messageId, true);
                                }}
                                disabled={isSubmittingFeedback}
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                  feedback === true
                                    ? 'border-[var(--color-primary-main)] bg-[var(--color-primary-main)] text-white'
                                    : 'border-[#c9d3e3] bg-white text-[#72839b]'
                                } disabled:opacity-50`}
                                aria-label="좋아요"
                                title="좋아요"
                              >
                                <svg
                                  data-slot="icon"
                                  fill="none"
                                  strokeWidth="1.5"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                  aria-hidden="true"
                                  className="h-4 w-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
                                  />
                                </svg>
                                좋아요
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  void handleMessageFeedback(messageId, false);
                                }}
                                disabled={isSubmittingFeedback}
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                  feedback === false
                                    ? 'border-[var(--color-primary-main)] bg-[var(--color-primary-main)] text-white'
                                    : 'border-[#c9d3e3] bg-white text-[#72839b]'
                                } disabled:opacity-50`}
                                aria-label="싫어요"
                                title="싫어요"
                              >
                                <svg
                                  data-slot="icon"
                                  fill="none"
                                  strokeWidth="1.5"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                  aria-hidden="true"
                                  className="h-4 w-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54"
                                  />
                                </svg>
                                싫어요
                              </button>
                            </div>
                          );
                        })()}
                      </>
                    );
                  })()}
                </div>
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="border-t border-[#dbe3ee] bg-white px-2.5 py-2">
          <div className="flex items-center gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing || event.keyCode === 229) {
                  return;
                }
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="메시지를 입력해 주세요"
              rows={1}
              className="max-h-28 min-h-9 flex-1 resize-y rounded-xl border border-[#d7dfeb] px-3 py-2 text-sm outline-none focus:border-[#35558b]"
            />
            <button
              type="button"
              onClick={() => {
                void handleSend();
              }}
              disabled={!input.trim() || isStreaming || authStatus !== 'authed'}
              className="h-10 rounded-xl bg-[#35558b] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#aab8cf]"
            >
              전송
            </button>
          </div>
          {errorMessage ? <p className="mt-2 text-xs text-red-500">{errorMessage}</p> : null}
        </div>
      </div>
    </section>
  );
}
