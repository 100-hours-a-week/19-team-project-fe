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
  | 'FORBIDDEN'
  | 'INTERNAL_SERVER_ERROR';

export type CommonErrorResponse = {
  code: CommonErrorCode;
  message: string;
  data: null;
};
