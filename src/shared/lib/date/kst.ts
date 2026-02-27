const KST_TIME_ZONE = 'Asia/Seoul';
const KST_LOCALE = 'ko-KR';

const pad2 = (value: number) => value.toString().padStart(2, '0');

const hasTimezoneInfo = (value: string) => /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);

const normalizeDateString = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const normalized = trimmed.replace(' ', 'T');

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return `${normalized}T00:00:00Z`;
  }

  if (normalized.includes('T') && !hasTimezoneInfo(normalized)) {
    return `${normalized}Z`;
  }

  return normalized;
};

export const parseServerDate = (value: string | Date | number | null | undefined): Date | null => {
  if (value === null || value === undefined) return null;

  const parsed =
    typeof value === 'string' ? new Date(normalizeDateString(value)) : new Date(value);

  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

export const formatKstString = (
  value: string | Date | number | null | undefined,
  options: Intl.DateTimeFormatOptions,
) => {
  const parsed = parseServerDate(value);
  if (!parsed) return null;
  return new Intl.DateTimeFormat(KST_LOCALE, { timeZone: KST_TIME_ZONE, ...options }).format(
    parsed,
  );
};

export const getKstDateParts = (value: string | Date | number | null | undefined) => {
  const parsed = parseServerDate(value);
  if (!parsed) return null;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(parsed);
  const readPart = (type: 'year' | 'month' | 'day' | 'hour' | 'minute') =>
    Number(parts.find((part) => part.type === type)?.value);

  const year = readPart('year');
  const month = readPart('month');
  const day = readPart('day');
  const hour = readPart('hour');
  const minute = readPart('minute');

  if ([year, month, day, hour, minute].some((part) => Number.isNaN(part))) return null;

  return { year, month, day, hour, minute };
};

export const isSameKstDay = (
  left: string | Date | number | null | undefined,
  right: string | Date | number | null | undefined,
) => {
  const leftParts = getKstDateParts(left);
  const rightParts = getKstDateParts(right);
  if (!leftParts || !rightParts) return false;

  return (
    leftParts.year === rightParts.year &&
    leftParts.month === rightParts.month &&
    leftParts.day === rightParts.day
  );
};

export const formatKstAmPmTime = (value: string | Date | number | null | undefined) => {
  const parts = getKstDateParts(value);
  if (!parts) return null;
  const period = parts.hour < 12 ? '오전' : '오후';
  const displayHour = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
  return `${period} ${pad2(displayHour)}:${pad2(parts.minute)}`;
};

export const formatKstYmd = (value: string | Date | number | null | undefined) => {
  const parts = getKstDateParts(value);
  if (!parts) return null;
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
};

export const formatKstMonthDay = (value: string | Date | number | null | undefined) => {
  const parts = getKstDateParts(value);
  if (!parts) return null;
  return `${pad2(parts.month)}.${pad2(parts.day)}`;
};

export const formatKstLongDate = (value: string | Date | number | null | undefined) => {
  const parts = getKstDateParts(value);
  if (!parts) return null;
  return `${parts.year}년 ${parts.month}월 ${parts.day}일`;
};
