import type { ReactNode } from 'react';

import { formatKstDateTime, getKstDateKey, parseKstDate } from '@/shared/lib/dateTime';

export const formatChatTime = (value: string) => {
  const parsed = parseChatDate(value);
  if (!parsed) return value;
  return (
    formatKstDateTime(parsed, { hour: '2-digit', minute: '2-digit', hour12: false }) || value
  );
};

export const formatChatDate = (value: string) => {
  const parsed = parseChatDate(value);
  if (!parsed) return value;
  return formatKstDateTime(parsed, { year: 'numeric', month: 'numeric', day: 'numeric' }) || value;
};

export const getChatDateKey = (value: string) => {
  return getKstDateKey(value) || value;
};

const parseChatDate = (value: string) => parseKstDate(value);

export const renderMessageContent = (content: string) => {
  const normalized = content.replace(/\s+$/g, '');
  const nodes: ReactNode[] = [];
  const regex = /https?:\/\/[^\s]+/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(normalized.slice(lastIndex, match.index));
    }
    const url = match[0];
    nodes.push(
      <a
        key={`${match.index}-${url}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        {url}
      </a>,
    );
    lastIndex = match.index + url.length;
  }

  if (lastIndex < normalized.length) {
    nodes.push(normalized.slice(lastIndex));
  }

  return nodes;
};
