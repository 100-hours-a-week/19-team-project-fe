'use client';

export const REPORT_CREATE_ACCEPTED_EVENT = 'report-create-accepted';
export const REPORT_CREATE_ACCEPTED_STORAGE_KEY = 'reportCreateAccepted';
export const CHAT_FEEDBACK_SUBMITTED_STORAGE_PREFIX = 'chatFeedbackSubmitted:';
export const CHAT_REVIEW_SUBMITTED_STORAGE_PREFIX = 'chatReviewSubmitted:';

export function markReportCreateAccepted() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(REPORT_CREATE_ACCEPTED_STORAGE_KEY, 'true');
  window.dispatchEvent(new Event(REPORT_CREATE_ACCEPTED_EVENT));
}

export function consumeReportCreateAccepted(): boolean {
  if (typeof window === 'undefined') return false;
  const flag = sessionStorage.getItem(REPORT_CREATE_ACCEPTED_STORAGE_KEY);
  if (!flag) return false;
  sessionStorage.removeItem(REPORT_CREATE_ACCEPTED_STORAGE_KEY);
  return true;
}

export function markChatFeedbackSubmitted(chatId: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${CHAT_FEEDBACK_SUBMITTED_STORAGE_PREFIX}${chatId}`, 'true');
}

export function hasChatFeedbackSubmitted(chatId: number): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`${CHAT_FEEDBACK_SUBMITTED_STORAGE_PREFIX}${chatId}`) === 'true';
}

export function markChatReviewSubmitted(chatId: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${CHAT_REVIEW_SUBMITTED_STORAGE_PREFIX}${chatId}`, 'true');
}

export function hasChatReviewSubmitted(chatId: number): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`${CHAT_REVIEW_SUBMITTED_STORAGE_PREFIX}${chatId}`) === 'true';
}
