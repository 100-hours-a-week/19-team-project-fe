import type { ReactNode } from 'react';

const pad2 = (value: number) => value.toString().padStart(2, '0');

const parseChatDate = (value: string) => {
  const normalized = value.replace(' ', 'T');
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

export const formatChatTime = (value: string) => {
  const parsed = parseChatDate(value);
  if (!parsed) return value;

  const hours = parsed.getHours();
  const minutes = pad2(parsed.getMinutes());
  const period = hours < 12 ? '오전' : '오후';
  const displayHours = pad2(hours % 12 === 0 ? 12 : hours % 12);

  return `${period} ${displayHours}:${minutes}`;
};

export const formatChatDate = (value: string) => {
  const parsed = parseChatDate(value);
  if (!parsed) return value;
  return `${parsed.getFullYear()}년 ${parsed.getMonth() + 1}월 ${parsed.getDate()}일`;
};

export const getChatDateKey = (value: string) => {
  const parsed = parseChatDate(value);
  if (!parsed) return value;
  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
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
