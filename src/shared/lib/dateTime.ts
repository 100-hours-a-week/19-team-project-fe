const KST_TIME_ZONE = 'Asia/Seoul';

const formatterCache = new Map<string, Intl.DateTimeFormat>();

const getFormatter = (locale: string, options: Intl.DateTimeFormatOptions) => {
  const cacheKey = `${locale}:${JSON.stringify(options)}`;
  const cached = formatterCache.get(cacheKey);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat(locale, options);
  formatterCache.set(cacheKey, formatter);
  return formatter;
};

const normalizeDateTimeString = (value: string) => value.trim().replace(' ', 'T');
const DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2})(?::(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?)?(Z|[+-]\d{2}:?\d{2})?$/i;

const parseDateTime = (value: string) => {
  const match = DATE_TIME_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4] ?? '0');
  const minute = Number(match[5] ?? '0');
  const second = Number(match[6] ?? '0');
  const fraction = (match[7] ?? '').slice(0, 3).padEnd(3, '0');
  const millisecond = Number(fraction || '0');
  const zoneToken = match[8];

  let offsetMinutes = 0; // no timezone token -> treat as UTC
  if (zoneToken && zoneToken.toUpperCase() !== 'Z') {
    const sign = zoneToken.startsWith('-') ? -1 : 1;
    const zoneHours = Number(zoneToken.slice(1, 3));
    const zoneMinutes = Number(zoneToken.slice(zoneToken.length - 2));
    offsetMinutes = sign * (zoneHours * 60 + zoneMinutes);
  }

  const utcTime = Date.UTC(year, month - 1, day, hour, minute, second, millisecond) - offsetMinutes * 60 * 1000;
  const parsed = new Date(utcTime);

  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

export const parseKstDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;

  const normalized = normalizeDateTimeString(value);
  if (!normalized) return null;

  return parseDateTime(normalized);
};

export const formatKstDateTime = (
  value: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions,
  locale = 'ko-KR',
) => {
  const parsed =
    typeof value === 'string' ? parseKstDate(value) : value instanceof Date ? value : null;
  if (!parsed) return '';

  return getFormatter(locale, {
    ...options,
    timeZone: KST_TIME_ZONE,
  }).format(parsed);
};

export const formatKstDate = (
  value: Date | string | null | undefined,
  locale = 'ko-KR',
) =>
  formatKstDateTime(
    value,
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    locale,
  );

export const getKstDateKey = (value: Date | string | null | undefined) => {
  const parsed =
    typeof value === 'string' ? parseKstDate(value) : value instanceof Date ? value : null;
  if (!parsed) return '';

  const formatter = getFormatter('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: KST_TIME_ZONE,
  });

  return formatter.format(parsed);
};
