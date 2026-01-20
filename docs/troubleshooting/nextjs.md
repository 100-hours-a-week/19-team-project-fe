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

---

## searchParams Promise 접근 에러 (App Router)

### 증상

- `searchParams`를 바로 읽을 때 `searchParams is a Promise and must be unwrapped` 에러 발생
- `/onboarding/profile` 진입 시 런타임 에러

### 발생 위치

- `src/app/onboarding/profile/page.tsx`

### 원인

- App Router에서 `searchParams`가 비동기(`Promise`)로 전달되는 모드
- 동기적으로 `searchParams.role`에 접근해 에러 발생

### 해결

- 페이지 컴포넌트를 `async`로 전환
- `searchParams`를 `await`로 풀어 `role`을 계산

### 적용한 수정 요약

- `searchParams?: Promise<{ role?: string }>` 형태로 변경
- `const params = searchParams ? await searchParams : undefined` 적용

---

## useEffect 내 setState 경고 (react-hooks/set-state-in-effect)

### 증상

- `Calling setState synchronously within an effect body...` ESLint 에러
- `useEffect` 시작 시 `setSkillsLoading(true)` 호출로 규칙 위반

### 발생 위치

- `src/widgets/onboarding/ui/OnboardingProfileForm.tsx`

### 원인

- effect 진입 시점에 즉시 `setState`를 호출해 불필요한 렌더 체인 유발

### 해결

- 초기 상태값을 로딩 상태로 설정해 effect 시작 시 `setState` 호출 제거

### 적용한 수정 요약

- `skillsLoading` 기본값을 `true`로 변경
- `setSkillsLoading(true)`/`setSkillsError(null)` 호출 제거
