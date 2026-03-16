'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createChatReview } from '../api/createChatReview';
import { markChatReviewSubmitted } from '../lib/reportCreate.client';
import { useCommonApiErrorHandler } from '@/shared/api';
import { useToast } from '@/shared/ui/toast';

const COMMENT_MAX_LENGTH = 300;

export function useChatReviewForm(chatId: number) {
  const router = useRouter();
  const { pushToast } = useToast();
  const handleCommonApiError = useCommonApiErrorHandler();

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedComment = useMemo(() => comment.trim(), [comment]);

  const canSubmit = useMemo(() => {
    return rating >= 1 && rating <= 5 && trimmedComment.length > 0;
  }, [rating, trimmedComment.length]);

  const updateComment = (nextValue: string) => {
    setComment(nextValue.slice(0, COMMENT_MAX_LENGTH));
    setSubmitError(null);
  };

  const updateRating = (nextValue: number) => {
    setRating(nextValue);
    setSubmitError(null);
  };

  const submitReview = async () => {
    if (isSubmitting) return;

    if (!canSubmit) {
      if (rating < 1 || rating > 5) {
        setSubmitError('평점을 선택해 주세요.');
        return;
      }
      if (trimmedComment.length === 0) {
        setSubmitError('리뷰 내용을 입력해 주세요.');
        return;
      }
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await createChatReview({
        chatId,
        payload: {
          rating,
          comment: trimmedComment,
        },
      });
      markChatReviewSubmitted(chatId);
      pushToast('리뷰가 등록되었습니다.', { variant: 'success' });
      router.replace('/chat?tab=closed');
    } catch (error) {
      const handled = await handleCommonApiError(error);
      if (!handled) {
        setSubmitError(error instanceof Error ? error.message : '리뷰 등록에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    rating,
    comment,
    isSubmitting,
    submitError,
    canSubmit,
    maxCommentLength: COMMENT_MAX_LENGTH,
    updateRating,
    updateComment,
    submitReview,
  };
}
