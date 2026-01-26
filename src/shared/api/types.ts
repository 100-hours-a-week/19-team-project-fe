export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export type CommonErrorCode =
  | 'INVALID_CURSOR'
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_INVALID_TOKEN'
  | 'FORBIDDEN'
  | 'INTERNAL_SERVER_ERROR';

export type CommonErrorResponse = {
  code: CommonErrorCode;
  message: string;
  data: null;
};
