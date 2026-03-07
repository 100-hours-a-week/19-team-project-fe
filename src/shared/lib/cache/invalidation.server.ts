import 'server-only';

import { revalidatePath, revalidateTag } from 'next/cache';

import { cacheTags } from './tags';

export function invalidateReportCache(reportId: string | number) {
  revalidateTag(cacheTags.reportList, 'max');
  revalidateTag(cacheTags.reportDetail(reportId), 'max');
  revalidatePath('/report');
  revalidatePath(`/report/${reportId}`);
}

export function invalidateReportListCache() {
  revalidateTag(cacheTags.reportList, 'max');
  revalidatePath('/report');
}

export function invalidateResumeCache(resumeId: string | number) {
  revalidateTag(cacheTags.resumeList, 'max');
  revalidateTag(cacheTags.resumeDetail(resumeId), 'max');
  revalidatePath('/resume');
  revalidatePath(`/resume/${resumeId}`);
}

export function invalidateResumeListCache() {
  revalidateTag(cacheTags.resumeList, 'max');
  revalidatePath('/resume');
}

export function invalidateChatCache(chatId: string | number) {
  revalidateTag(cacheTags.chatDetail(chatId), 'max');
  revalidateTag(cacheTags.chatMessages(chatId), 'max');
  revalidatePath('/chat');
  revalidatePath(`/chat/${chatId}`);
  revalidatePath(`/chat/${chatId}/detail`);
  revalidatePath(`/chat/${chatId}/feedback`);
}
