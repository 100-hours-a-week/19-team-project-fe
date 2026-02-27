import type { ReactNode } from 'react';
import {
  formatKstAmPmTime,
  formatKstLongDate,
  formatKstYmd,
} from '@/shared/lib/date';

export const formatChatTime = (value: string) => {
  return formatKstAmPmTime(value) ?? value;
};

export const formatChatDate = (value: string) => {
  return formatKstLongDate(value) ?? value;
};

export const getChatDateKey = (value: string) => {
  return formatKstYmd(value) ?? value;
};

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
