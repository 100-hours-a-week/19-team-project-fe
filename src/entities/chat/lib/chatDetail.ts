import type { ChatDetailData } from '@/entities/chat';

import { normalizeRequestTypeFromUnknown } from './requestType';

export const normalizeChatDetail = (detail: ChatDetailData): ChatDetailData => {
  const requestType = normalizeRequestTypeFromUnknown(detail) ?? undefined;
  const hasReportRaw =
    (detail as { has_report?: unknown }).has_report ??
    (detail as { hasReport?: unknown }).hasReport ??
    false;
  const hasReport = Boolean(hasReportRaw);

  return {
    ...detail,
    request_type: requestType,
    has_report: hasReport,
    hasReport,
  };
};
