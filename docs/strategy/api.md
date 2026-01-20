# API 연동 전략

본 프로젝트는 **모든 API를 단일 방식으로 처리하지 않고**,
**클라이언트 직접 호출**과 **Next.js 서버(BFF) 경유 호출**을 혼합 적용한다.

API의 성격에 따라 호출 책임을 분리함으로써
**성능, 보안, 유지보수성**을 동시에 확보하는 것을 목표로 한다.

---

## 1. API 호출 방식 분리 전략

### 기본 원칙

- 모든 API를 하나의 호출 방식으로 처리하지 않는다.
- API의 **공개 여부**, **인증 필요성**, **민감도**에 따라 호출 경로를 분리한다.
- Next.js는 단순 UI 프레임워크가 아닌 **경량 BFF (Backend For Frontend)** 계층으로 활용한다.

### 호출 방식 구분

| 구분                     | 호출 방식            | 목적                    |
| ------------------------ | -------------------- | ----------------------- |
| 공개 데이터 / 비인증 API | 클라이언트 직접 호출 | 성능, 단순성, SEO       |
| 인증 필요 / 민감 API     | Next.js 서버 경유    | 보안, 일관성, 접근 제어 |

### 설계 의도

- **공개 API**
  - 클라이언트에서 직접 호출하여 네트워크 홉을 줄인다
  - 서버 부하 감소 및 응답 속도 최적화
  - SEO 및 RSC/SSR 활용에 유리

- **인증/민감 API**
  - Next.js 서버를 경유하여 호출
  - 토큰 관리와 접근 제어를 서버에서 중앙화
  - 인증 로직과 데이터 접근 정책을 UI로부터 분리

---

## 2. 인증 토큰 처리 전략

### 토큰 관리 원칙

- 인증 토큰은 **브라우저 JavaScript 영역에 저장하지 않는다**
- 토큰은 **Next.js 서버 레이어에서만 관리**한다
- 클라이언트는 **토큰의 존재를 알 필요가 없다**

### 인증 흐름 개요

1. 로그인 성공
   - `access_token`, `refresh_token` 발급
   - **HttpOnly Cookie**로 저장

2. API 요청 흐름

   ```
   Client → Next.js Server (Cookie 자동 포함)
          → Backend API (Authorization Header 전달)
   ```

3. Access Token 만료
   - Backend API가 `401` 반환
   - Next.js Server가 `refresh_token`으로 재발급 요청
   - 새로운 `access_token` 재설정

4. Refresh Token 만료 또는 실패
   - 전체 로그아웃 처리

### 기대 효과

- XSS로 인한 토큰 탈취 위험 최소화
- 인증 실패, 토큰 갱신, 로그아웃 정책을 서버에서 일관되게 관리
- UI는 인증 상태 관리에 대한 책임을 가지지 않음

---

## 3. API 응답 처리 방식

### 공통 응답 처리 원칙

- (웹소켓, 헬스체크를 제외한) 모든 API 응답은 **공통 포맷으로 정규화**
- HTTP 에러와 비즈니스 에러를 명확히 구분
- UI 레이어는 에러 구조를 직접 해석하지 않는다

### 공통 응답 포맷

```ts
interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}
```

---

### 성공 응답 처리

- 모든 서버 데이터는 **TanStack Query**를 통해 관리
- 서버 상태는 Query를 **단일 진실 소스(Single Source of Truth)**로 유지
- Mutation 이후 관련 Query를 무효화하여 데이터 동기화 보장

---

## 4. API 호출 구현 전략

### 기본 호출 수단

- `fetch` 기반 **커스텀 wrapper** 사용
- Next.js 환경(RSC, SSR, 캐싱)과의 호환성을 최우선으로 고려

```ts
export async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    credentials: 'include',
    ...init,
  });

  if (!res.ok) {
    throw new Error('API Error');
  }

  return res.json();
}
```

---

### API Layer와 TanStack Query의 역할 분리

- **API Layer**
  - 요청/응답 처리
  - 인증 및 토큰 전달
  - 에러 표준화

- **TanStack Query**
  - 캐싱
  - 재요청
  - 서버 상태 동기화

> **데이터의 생명주기**는 TanStack Query가 관리하고
> **데이터의 전달 방식**은 API Layer가 담당한다.

---

## 결론

이 전략을 통해 다음을 동시에 달성한다.

- API 성격에 따른 최적의 호출 방식 적용
- 인증 및 보안 로직의 서버 집중화
- UI와 데이터/인증 로직 간 책임 분리
- 변경에 강한 구조로 유지보수성 확보
