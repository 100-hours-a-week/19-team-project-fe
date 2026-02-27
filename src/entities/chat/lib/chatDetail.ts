import type { ChatDetailData } from '@/entities/chat';

import { normalizeRequestTypeFromUnknown } from './requestType';

export const normalizeChatDetail = (detail: ChatDetailData): ChatDetailData => {
  const requestType = normalizeRequestTypeFromUnknown(detail) ?? undefined;

  return {
    ...detail,
    request_type: requestType,
  };
};
