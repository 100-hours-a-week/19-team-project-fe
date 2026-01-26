export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export type CommonErrorCode =
  | 'INVALID_CURSOR'
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_INVALID_TOKEN'
  | 'AUTH_INVALID_REQUEST'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_FORBIDDEN'
  | 'EXPERT_USER_ID_INVALID'
  | 'EXPERT_FILTER_INVALID'
  | 'EXPERT_NOT_FOUND'
  | 'CHAT_RECEIVER_NOT_FOUND'
  | 'CHAT_REQUEST_TYPE_INVALID'
  | 'CHAT_RECEIVER_IS_SELF'
  | 'CONFLICT'
  | 'CHAT_NOT_FOUND'
  | 'FORBIDDEN'
  | 'INTERNAL_SERVER_ERROR';

export type CommonErrorResponse = {
  code: CommonErrorCode;
  message: string;
  data: null;
};
