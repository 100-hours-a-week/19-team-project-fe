# Next.js 트러블슈팅

## useSearchParams 빌드 에러 (Suspense 필요)

### 증상

- `useSearchParams() should be wrapped in a suspense boundary` 에러로 `next build` 실패
- `/auth/social/callback` 프리렌더 단계에서 중단

### 발생 위치

- `src/app/(auth)/auth/social/callback/page.tsx`

### 원인

- `useSearchParams()`는 CSR bailout이 필요하므로 페이지 레벨에서 `Suspense`로 감싸야 함
- 클라이언트 컴포넌트를 직접 페이지에서 렌더하면 프리렌더 단계에서 에러 발생

### 해결

- `useSearchParams()`를 사용하는 UI를 클라이언트 컴포넌트로 분리
- 페이지 컴포넌트에서 `<Suspense>`로 감싸 렌더

### 적용한 수정 요약

- `KakaoCallbackClient`를 분리해 `Suspense`로 감쌈
- 페이지는 서버 컴포넌트로 유지하고 fallback만 제공
