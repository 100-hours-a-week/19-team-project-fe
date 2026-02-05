# apiFetch.ts 코드 리뷰 (블럭 단위 설명 가이드)

요구사항: 코드를 위에서 아래로 **블럭 단위(함수/조건문/구간)**로 쪼개고,
각 블럭이 **무슨 역할**인지, **왜 필요한지**, 그리고 **한 줄 한 줄 의미**를 직관적으로 설명한다.

> 기준 코드: `src/shared/api/apiFetch.ts`

---

## 0) import / 상수 / 타입 정의 블럭

```ts
import { readAccessToken } from './accessToken';
import { BusinessError, HttpError } from './errors';
import type { ApiResponse } from './types';

const DEFAULT_SUCCESS_CODES = ['SUCCESS', 'OK', 'CREATED'];
```

### 역할

- `readAccessToken`: 브라우저 쿠키에서 access token을 읽는 함수
- `BusinessError`: 서버 응답 `code` 기반의 업무 에러를 표현하는 클래스
- `HttpError`: HTTP 레벨 실패(4xx/5xx)를 표현하는 클래스
- `ApiResponse`: `{ code, message, data }` 형태 응답의 타입
- `DEFAULT_SUCCESS_CODES`: 성공으로 간주할 응답 `code` 리스트

### 왜 필요한가

- HTTP 200이어도 `code`가 실패일 수 있으므로, **업무 성공 여부**를 따로 판별하려는 의도.

---

## 1) 옵션 타입 블럭 (`ApiFetchOptions`)

```ts
export type ApiFetchOptions = RequestInit & {
  successCodes?: string[];
  retryOnUnauthorized?: boolean;
};
```

### 역할

- `RequestInit`(fetch 기본 옵션) + 유틸 전용 옵션을 합친 타입

### 왜 필요한가

- 공통 유틸에만 필요한 옵션(`successCodes`, `retryOnUnauthorized`)을 명확히 구분하고 확장 가능하게 하기 위해.

### 줄별 의미

- `RequestInit`: `method`, `headers`, `body`, `credentials` 등 fetch 표준 옵션
- `successCodes?`: 성공으로 인정할 `body.code` 목록 커스터마이징
- `retryOnUnauthorized?`: 401 발생 시 재시도(토큰 갱신) 여부

---

## 2) 브라우저 환경 체크 블럭 (`isBrowser`)

```ts
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}
```

### 역할

- 현재 실행 환경이 브라우저인지 판별

### 왜 필요한가

- Next.js는 서버에서도 실행될 수 있음
- 서버에는 `window`, `document`가 없으므로, 브라우저 전용 로직을 막기 위한 안전장치

### 줄별 의미

- `window`/`document` 존재 여부로 클라이언트 환경 판별

---

## 3) RequestInfo에서 URL 추출 블럭 (`getRequestUrl`)

```ts
function getRequestUrl(input: RequestInfo): string | null {
  if (typeof input === 'string') return input;
  if (typeof URL !== 'undefined' && input instanceof URL) return input.toString();
  if (typeof Request !== 'undefined' && input instanceof Request) return input.url;
  return null;
}
```

### 역할

- `fetch`의 첫 인자(`RequestInfo`)에서 URL 문자열을 추출

### 왜 필요한가

- 현재 요청이 **토큰 재발급 요청인지** 판별해야 무한 재시도 방지 가능

### 줄별 의미

- 문자열 URL이면 그대로 반환
- `URL` 객체면 문자열로 변환
- `Request` 객체면 `.url`로 추출
- 어떤 경우도 아니면 `null`

---

## 4) 최신 토큰 반영 블럭 (`refreshInitWithLatestToken`)

```ts
function refreshInitWithLatestToken(init?: ApiFetchOptions): ApiFetchOptions | undefined {
  if (!isBrowser() || !init?.headers) return init;
  const token = readAccessToken();
  if (!token) return init;
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return { ...init, headers };
}
```

### 역할

- refresh 성공 이후 **재시도 요청에 최신 access token을 반영**

### 왜 필요한가

- 토큰 갱신 후에도 옛 토큰으로 재요청하면 다시 401이 발생함

### 줄별 의미

- 브라우저가 아니거나 `headers`가 없으면 그대로 반환
- 최신 토큰을 쿠키에서 읽음
- 토큰이 없으면 그대로 반환
- `Headers` 객체로 변환해 수정 가능하게 만듦
- `Authorization` 헤더를 최신 토큰으로 덮어씀
- 변경된 `headers`를 포함한 `init` 반환

---

## 5) 토큰 갱신 시도 블럭 (`tryRefreshAuthTokens`)

```ts
async function tryRefreshAuthTokens(): Promise<boolean> {
  if (!isBrowser()) return false;
  try {
    const { refreshAuthTokens } = await import('./refreshTokens.client');
    return await refreshAuthTokens().catch(() => false);
  } catch {
    return false;
  }
}
```

### 역할

- 401 발생 시 **토큰 갱신을 시도**하고 성공 여부를 boolean으로 반환

### 왜 필요한가

- 브라우저 전용 refresh 로직을 안전하게 호출하기 위해
- SSR에서 실행될 가능성을 차단

### 줄별 의미

- 서버 환경이면 refresh 불가 → `false`
- 동적 import로 클라이언트 전용 모듈 로드
- refresh 실패는 `false` 처리
- import 자체가 실패해도 `false`

---

## 6) 옵션 분해 블럭 (`apiFetch` 시작부)

```ts
export async function apiFetch<T>(input: RequestInfo, init?: ApiFetchOptions): Promise<T> {
  const {
    successCodes = DEFAULT_SUCCESS_CODES,
    retryOnUnauthorized = true,
    ...fetchInit
  } = init ?? {};
```

### 역할

- 공통 옵션과 fetch 옵션을 분리

### 왜 필요한가

- `successCodes`와 `retryOnUnauthorized`는 유틸 전용 옵션
- 나머지는 그대로 `fetch`에 전달하기 위해

### 줄별 의미

- `init`이 없을 수 있으니 `init ?? {}`
- `successCodes` 기본값을 지정
- `retryOnUnauthorized` 기본값을 지정
- 나머지는 `fetchInit`으로 묶음

---

## 7) fetch 실행 블럭

```ts
const res = await fetch(input, {
  credentials: 'include',
  ...fetchInit,
});
```

### 역할

- 실제 네트워크 요청 수행

### 왜 필요한가

- 쿠키 기반 인증/리프레시 토큰 사용을 위해 `credentials: 'include'` 필요

### 줄별 의미

- `credentials: 'include'`: 쿠키 포함 요청
- `...fetchInit`: 호출부에서 넘긴 옵션 적용

---

## 8) 401 처리 + 재시도 블럭

```ts
if (res.status === 401 && retryOnUnauthorized) {
  const requestUrl = getRequestUrl(input);
  const isTokenRefresh = requestUrl?.includes('/bff/auth/tokens') ?? false;
  if (!isTokenRefresh) {
    const refreshed = await tryRefreshAuthTokens();
    if (refreshed) {
      const retryInit = refreshInitWithLatestToken({ ...init, retryOnUnauthorized: false });
      return apiFetch<T>(input, retryInit);
    }
  }
}
```

### 역할

- 401이면 토큰 갱신을 시도하고 성공 시 **한 번만 재요청**

### 왜 필요한가

- 사용자 경험 개선(재로그인 없이 자동 갱신)
- 토큰 갱신 요청에서 무한 루프 방지

### 줄별 의미

- 401이면서 재시도가 허용된 경우만 진행
- 요청 URL을 추출
- 토큰 갱신 요청인지 판별 (`/bff/auth/tokens`)
- refresh 요청 자체면 재시도 금지
- refresh 성공 시 재요청
- 재요청 시 `retryOnUnauthorized: false`로 재귀 무한 루프 방지

---

## 9) HTTP 실패 처리 블럭 (`!res.ok`)

```ts
if (!res.ok) {
  try {
    const errorBody = (await res.json()) as ApiResponse<unknown>;
    if (errorBody && typeof errorBody.code === 'string') {
      throw new BusinessError(errorBody.code, errorBody.message, errorBody.data);
    }
  } catch (parseError) {
    if (parseError instanceof BusinessError) {
      throw parseError;
    }
  }
  throw new HttpError(res.status, res.statusText, res.url);
}
```

### 역할

- HTTP 레벨 실패를 **BusinessError 또는 HttpError**로 변환

### 왜 필요한가

- 서버가 `{code, message}`를 주는 경우: 업무 에러로 분기
- 그 외 네트워크/HTTP 문제는 `HttpError`로 통일

### 줄별 의미

- `res.ok`가 false면 진입
- 응답 본문을 JSON으로 파싱 시도
- `code`가 있으면 `BusinessError`로 throw
- 파싱 실패 시 `HttpError`로 fallback

---

## 10) HTTP 성공 후 body 파싱 블럭

```ts
const body = (await res.json()) as ApiResponse<T>;
```

### 역할

- 성공 응답을 `{ code, message, data }` 형태로 파싱

### 왜 필요한가

- 다음 단계에서 `body.code`를 검사해야 함

---

## 11) 비즈니스 코드 성공 여부 체크 블럭

```ts
if (!successCodes.includes(body.code)) {
  throw new BusinessError(body.code, body.message, body.data);
}
```

### 역할

- HTTP 200이어도 `code`가 실패면 에러로 처리

### 왜 필요한가

- 서버는 HTTP 성공 + 비즈니스 실패를 분리해서 내려줄 수 있음
- 호출부는 성공 시 `data`만 받고 실패는 예외로 처리하도록 단순화

---

## 12) 최종 반환 블럭

```ts
  return body.data;
}
```

### 역할

- 성공 시 `data`만 반환

### 왜 필요한가

- 호출부에서 `res.data`가 아닌 **직접 data**를 쓰도록 편의 제공

---

## 주의/개선 포인트

- `refreshInitWithLatestToken`은 `init.headers`가 없으면 Authorization을 붙이지 못함
- `res.json()`은 204 No Content 응답에서 예외가 날 수 있음

---

## 용어 정리

[1] fetchInit은 뭐야? 내장인가?
❌ 결론부터: 내장 아님

fetchInit은 이 함수 안에서 만든 변수 이름이야.

const {
successCodes = DEFAULT_SUCCESS_CODES,
retryOnUnauthorized = true,
...fetchInit
} = init ?? {};

여기서 벌어지는 일을 하나씩 뜯어보자.

1️⃣ init의 정체

init의 타입은 이거였지:

init?: ApiFetchOptions

그리고 ApiFetchOptions는:

type ApiFetchOptions = RequestInit & {
successCodes?: string[];
retryOnUnauthorized?: boolean;
};

즉 init 안에는 두 종류의 값이 섞여 있음:

🔹 A. fetch가 이해하는 옵션들 (내장)

method

headers

body

signal

cache

credentials 등
→ 이건 fetch가 쓰는 것

🔹 B. apiFetch만 아는 옵션들 (커스텀)

successCodes

retryOnUnauthorized

2️⃣ ...fetchInit이 하는 일
...fetchInit

이건 **“나머지 전부”**라는 뜻이야.

“successCodes, retryOnUnauthorized를 빼고
남은 나머지 속성들을 fetchInit이라는 객체에 담아라”

예시로 보면 👇
apiFetch('/api', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
successCodes: ['OK'],
retryOnUnauthorized: false
});

이때 destructuring 결과는:

successCodes = ['OK']
retryOnUnauthorized = false

fetchInit = {
method: 'POST',
headers: { 'Content-Type': 'application/json' }
}

👉 fetchInit = “fetch에게 넘길 순수한 옵션 묶음”

그래서 아래에서 이렇게 씀:

fetch(input, {
credentials: 'include',
...fetchInit
});

🔑 핵심 요약 (1번 질문)
항목 설명
fetchInit ❌ 내장 아님
정체 destructuring으로 만든 로컬 변수
역할 fetch로 넘길 옵션만 모아둔 객체
왜 필요 apiFetch 전용 옵션과 fetch 옵션을 분리하려고
[2] destructuring 에러가 뭐야?

이건 자바스크립트 문법 에러 + 런타임 에러 개념이야.
아주 쉽게 말하면:

“없는 것에서 꺼내려고 할 때 터지는 에러”

1️⃣ destructuring이 뭐냐면
const { a, b } = obj;

이건 사실상:

const a = obj.a;
const b = obj.b;

이거랑 같아.

2️⃣ 에러가 나는 상황
❌ 이런 코드
let init;
const { method } = init;

이거 실행하면 바로 터짐 💥

에러 메시지 (대표적)
TypeError: Cannot destructure property 'method' of 'undefined'

왜냐면:

init은 undefined

그런데 init.method를 읽으려고 함

undefined에는 속성이 없음

3️⃣ 그래서 이 코드가 있는 거다
} = init ?? {};

이게 무슨 뜻이냐면

init이 null 또는 undefined면

대신 {}(빈 객체)를 써라

즉:

const safeInit = init ?? {};
const { successCodes, retryOnUnauthorized } = safeInit;

이 효과를 한 줄로 쓴 거야.

4️⃣ 왜 || {} 말고 ?? {}를 썼을까?
❌ || {} 문제점
init || {}

init이 0, '', false여도 {}로 바뀜

의도치 않은 동작 가능

✅ ?? {} 장점
init ?? {}

null / undefined일 때만 {} 사용

정확한 방어

🔑 핵심 요약 (2번 질문)
개념 설명
destructuring 객체에서 값을 꺼내 변수로 만드는 문법
destructuring 에러 undefined / null에서 꺼내려 할 때 나는 에러
방어법 init ?? {}
왜 필요한가 apiFetch(url)처럼 옵션 없이 호출해도 안 터지게
마지막으로 한 문장 정리

fetchInit은 fetch로 넘길 옵션만 담은 변수 이름이고,
init ?? {}는 destructuring 하다가 터지는 걸 막기 위한 안전장치다.

이제 이 줄이 왜 “필요해서 있는 코드”인지 감이 올 거야 👌
다음으로 뭐 파볼까?
