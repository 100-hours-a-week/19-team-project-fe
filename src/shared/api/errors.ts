export class HttpError extends Error {
  status: number;
  statusText: string;
  url?: string;

  constructor(status: number, statusText: string, url?: string) {
    super(`HTTP ${status} ${statusText}`);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
  }
}

export class BusinessError<TData = unknown> extends Error {
  code: string;
  data?: TData;

  constructor(code: string, message: string, data?: TData) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.data = data;
  }
}
