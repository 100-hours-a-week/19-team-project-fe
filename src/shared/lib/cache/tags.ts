const CACHE_TAG_PREFIX = 'refit';

function withPrefix(tag: string) {
  return `${CACHE_TAG_PREFIX}:${tag}`;
}

function normalizeId(value: string | number) {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '0';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '0';
}

export const cacheTags = {
  reportList: withPrefix('report:list'),
  reportDetail: (reportId: string | number) => withPrefix(`report:${normalizeId(reportId)}`),
  resumeList: withPrefix('resume:list'),
  resumeDetail: (resumeId: string | number) => withPrefix(`resume:${normalizeId(resumeId)}`),
  chatDetail: (chatId: string | number) => withPrefix(`chat:detail:${normalizeId(chatId)}`),
  chatMessages: (chatId: string | number) => withPrefix(`chat:messages:${normalizeId(chatId)}`),
  homeGuestRecommendations: withPrefix('home:recommendations:guest'),
} as const;
