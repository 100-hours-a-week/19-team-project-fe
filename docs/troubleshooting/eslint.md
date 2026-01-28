# ESLint 트러블슈팅

## 커밋 차단 해제 정책

### 의도

- 개발 속도를 우선하고, lint 이슈는 문서화로 추적한다
- pre-commit에서 lint 실패가 커밋을 막지 않도록 설정한다

### 적용

- `.husky/pre-commit`에서 lint 실패를 자동 기록하도록 변경
- lint 에러/경고는 이 문서의 Lint Log에 누적 기록된다

---

## TODO: lint 이슈 기록

- 현재 없음

## Lint Log

## react-hooks/immutability 에러

### 증상

- `Modifying a value returned from 'useState()'` 또는
  `Modifying a value returned from a hook is not allowed` 에러 발생
- 커밋 훅에서 `pnpm lint`가 실패하면서 커밋이 막힘

### 발생 위치

- `src/widgets/splash-screen/ui/Lanyard.tsx`
  - `curve.curveType = 'chordal'`
  - `texture.wrapS = texture.wrapT = THREE.RepeatWrapping`

### 원인

- 훅(`useState`, `useTexture`)에서 받은 값을 직접 수정(mutate)함
- `react-hooks/immutability` 룰은 훅 반환값의 직접 변경을 금지함
  - 재사용되는 객체가 예상치 못한 사이드 이펙트를 일으킬 수 있기 때문

### 해결

1. 생성 시점에 설정을 적용

- `curve`는 `useMemo`로 생성하면서 `curveType`을 지정

2. 새로운 객체를 만들어 교체

- `texture`는 `texture.clone()` 후 `wrapS/wrapT`를 설정하고 사용

### 적용한 수정 요약

- `useState`로 만들던 `curve`를 `useMemo`로 생성
- `texture`를 클론한 `lanyardTexture`를 만들어 머티리얼에 주입

### 참고 패턴

```tsx
const lanyardTexture = useMemo(() => {
  const cloned = texture.clone();
  cloned.wrapS = THREE.RepeatWrapping;
  cloned.wrapT = THREE.RepeatWrapping;
  cloned.needsUpdate = true;
  return cloned;
}, [texture]);

const curve = useMemo(() => {
  const nextCurve = new THREE.CatmullRomCurve3([...]);
  nextCurve.curveType = 'chordal';
  return nextCurve;
}, []);
```

## 불필요한 eslint-disable 경고 (2026-01-20)

### 증상

- `Unused eslint-disable directive` 경고 발생

### 발생 위치

- `src/widgets/splash-screen/ui/Lanyard.tsx`
  - `/* eslint-disable react/no-unknown-property */`

### 원인

- 실제로 `react/no-unknown-property` 문제가 없는데 주석이 남아 있음

### 해결

- 해당 `eslint-disable` 주석 제거

## Effect 내부 setState 경고 (2026-01-20)

### 증상

- `react-hooks/set-state-in-effect` 에러 발생

### 발생 위치

- `src/shared/ui/bottom-sheet/BottomSheet.tsx`
- `src/widgets/auth/social-login/ui/KakaoCallbackClient.tsx`

### 원인

- `useEffect` 본문에서 즉시 `setState`를 호출함

### 해결

- `BottomSheet`는 닫기 핸들러에서 상태를 리셋하도록 이동
- `KakaoCallbackClient`는 렌더 상태를 제거하고 리다이렉트만 수행

## Hook 의존성 누락 경고 (2026-01-20)

### 증상

- `react-hooks/exhaustive-deps` 경고 발생

### 발생 위치

- `src/widgets/onboarding/ui/OnboardingProfileForm.tsx`

### 원인

- `useMemo`에서 참조하는 리스트가 컴포넌트 내부에서 매 렌더마다 새로 생성됨

### 해결

- 리스트를 모듈 상수로 분리해 참조 안정화
- `useMemo`는 `techQuery`만 의존하도록 정리

### 2026-01-20

- Logged at: 2026-01-20 10:53:08Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/app/(auth)/auth/social/callback/page.tsx
  23:7  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/junseopark/re-fit/src/app/(auth)/auth/social/callback/page.tsx:23:7
  21 |     if (error) {
  22 |       sessionStorage.setItem('kakaoLoginError', errorDescription ?? error);
> 23 |       setStatus('error');
     |       ^^^^^^^^^ Avoid calling setState() directly within an effect
  24 |       router.replace('/');
  25 |       return;
  26 |     }  react-hooks/set-state-in-effect

/Users/junseopark/re-fit/src/shared/ui/bottom-sheet/BottomSheet.tsx
  31:7  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/junseopark/re-fit/src/shared/ui/bottom-sheet/BottomSheet.tsx:31:7
  29 |   useEffect(() => {
  30 |     if (!open) {
> 31 |       setDragOffset(0);
     |       ^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  32 |       setIsDragging(false);
  33 |     }
  34 |   }, [open]);  react-hooks/set-state-in-effect

/Users/junseopark/re-fit/src/widgets/onboarding/ui/OnboardingProfileForm.tsx
  65:6  warning  React Hook useMemo has a missing dependency: 'techStack'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 3 problems (2 errors, 1 warning)

 ELIFECYCLE  Command failed with exit code 1.
```

### 2026-01-20

- Logged at: 2026-01-20 10:54:06Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/app/(auth)/auth/social/callback/page.tsx
  23:7  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/junseopark/re-fit/src/app/(auth)/auth/social/callback/page.tsx:23:7
  21 |     if (error) {
  22 |       sessionStorage.setItem('kakaoLoginError', errorDescription ?? error);
> 23 |       setStatus('error');
     |       ^^^^^^^^^ Avoid calling setState() directly within an effect
  24 |       router.replace('/');
  25 |       return;
  26 |     }  react-hooks/set-state-in-effect

/Users/junseopark/re-fit/src/shared/ui/bottom-sheet/BottomSheet.tsx
  31:7  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/junseopark/re-fit/src/shared/ui/bottom-sheet/BottomSheet.tsx:31:7
  29 |   useEffect(() => {
  30 |     if (!open) {
> 31 |       setDragOffset(0);
     |       ^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  32 |       setIsDragging(false);
  33 |     }
  34 |   }, [open]);  react-hooks/set-state-in-effect

/Users/junseopark/re-fit/src/widgets/onboarding/ui/OnboardingProfileForm.tsx
  65:6  warning  React Hook useMemo has a missing dependency: 'techStack'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 3 problems (2 errors, 1 warning)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-20 Raw Log

- Logged at: 2026-01-20 11:00:52Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/app/(auth)/auth/social/callback/page.tsx
  23:7  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/junseopark/re-fit/src/app/(auth)/auth/social/callback/page.tsx:23:7
  21 |     if (error) {
  22 |       sessionStorage.setItem('kakaoLoginError', errorDescription ?? error);
> 23 |       setStatus('error');
     |       ^^^^^^^^^ Avoid calling setState() directly within an effect
  24 |       router.replace('/');
  25 |       return;
  26 |     }  react-hooks/set-state-in-effect

/Users/junseopark/re-fit/src/shared/ui/bottom-sheet/BottomSheet.tsx
  31:7  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/junseopark/re-fit/src/shared/ui/bottom-sheet/BottomSheet.tsx:31:7
  29 |   useEffect(() => {
  30 |     if (!open) {
> 31 |       setDragOffset(0);
     |       ^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  32 |       setIsDragging(false);
  33 |     }
  34 |   }, [open]);  react-hooks/set-state-in-effect

/Users/junseopark/re-fit/src/widgets/onboarding/ui/OnboardingProfileForm.tsx
  65:6  warning  React Hook useMemo has a missing dependency: 'techStack'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 3 problems (2 errors, 1 warning)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-20 Raw Log

- Logged at: 2026-01-20 11:12:59Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/shared/ui/bottom-sheet/BottomSheet.tsx
  31:7  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/junseopark/re-fit/src/shared/ui/bottom-sheet/BottomSheet.tsx:31:7
  29 |   useEffect(() => {
  30 |     if (!open) {
> 31 |       setDragOffset(0);
     |       ^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  32 |       setIsDragging(false);
  33 |     }
  34 |   }, [open]);  react-hooks/set-state-in-effect

/Users/junseopark/re-fit/src/widgets/auth/social-login/ui/KakaoCallbackClient.tsx
  23:7  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/junseopark/re-fit/src/widgets/auth/social-login/ui/KakaoCallbackClient.tsx:23:7
  21 |     if (error) {
  22 |       sessionStorage.setItem('kakaoLoginError', errorDescription ?? error);
> 23 |       setStatus('error');
     |       ^^^^^^^^^ Avoid calling setState() directly within an effect
  24 |       router.replace('/');
  25 |       return;
  26 |     }  react-hooks/set-state-in-effect

/Users/junseopark/re-fit/src/widgets/onboarding/ui/OnboardingProfileForm.tsx
  65:6  warning  React Hook useMemo has a missing dependency: 'techStack'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 3 problems (2 errors, 1 warning)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-20 Raw Log

- Logged at: 2026-01-20 16:37:59Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/widgets/onboarding/ui/OnboardingProfileForm.tsx
  51:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/junseopark/re-fit/src/widgets/onboarding/ui/OnboardingProfileForm.tsx:51:5
  49 |   useEffect(() => {
  50 |     let isMounted = true;
> 51 |     setSkillsLoading(true);
     |     ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  52 |     setSkillsError(null);
  53 |     getSkills()
  54 |       .then((data) => {  react-hooks/set-state-in-effect

✖ 1 problem (1 error, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-20 Raw Log

- Logged at: 2026-01-20 16:39:42Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/widgets/onboarding/ui/OnboardingProfileForm.tsx
  51:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/junseopark/re-fit/src/widgets/onboarding/ui/OnboardingProfileForm.tsx:51:5
  49 |   useEffect(() => {
  50 |     let isMounted = true;
> 51 |     setSkillsLoading(true);
     |     ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  52 |     setSkillsError(null);
  53 |     getSkills()
  54 |       .then((data) => {  react-hooks/set-state-in-effect

✖ 1 problem (1 error, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-20 Raw Log

- Logged at: 2026-01-20 16:40:13Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/widgets/onboarding/ui/OnboardingProfileForm.tsx
  51:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/junseopark/re-fit/src/widgets/onboarding/ui/OnboardingProfileForm.tsx:51:5
  49 |   useEffect(() => {
  50 |     let isMounted = true;
> 51 |     setSkillsLoading(true);
     |     ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  52 |     setSkillsError(null);
  53 |     getSkills()
  54 |       .then((data) => {  react-hooks/set-state-in-effect

✖ 1 problem (1 error, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-20 Raw Log

- Logged at: 2026-01-20 16:46:57Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/shared/ui/bottom-sheet/BottomSheet.tsx
  22:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/junseopark/re-fit/src/shared/ui/bottom-sheet/BottomSheet.tsx:22:5
  20 |
  21 |   useEffect(() => {
> 22 |     setMounted(true);
     |     ^^^^^^^^^^ Avoid calling setState() directly within an effect
  23 |   }, []);
  24 |
  25 |   useEffect(() => {  react-hooks/set-state-in-effect

✖ 1 problem (1 error, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-22 Raw Log

- Logged at: 2026-01-22 06:22:23Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/widgets/onboarding/ui/OnboardingProfileForm.tsx
  156:13  warning  'email' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/Users/junseopark/re-fit/src/widgets/splash-screen/ui/SplashGate.tsx
  17:7  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/junseopark/re-fit/src/widgets/splash-screen/ui/SplashGate.tsx:17:7
  15 |   useEffect(() => {
  16 |     if (sessionStorage.getItem('signupSuccess')) {
> 17 |       setShowSplash(false);
     |       ^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  18 |       return;
  19 |     }
  20 |     const timer = setTimeout(() => setShowSplash(false), durationMs);  react-hooks/set-state-in-effect

✖ 2 problems (1 error, 1 warning)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-22 Raw Log

- Logged at: 2026-01-22 08:23:18Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/app/(auth)/auth/social/page.tsx
  1:1  error  '@/widgets/auth' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/app/oauth/kakao/callback/page.tsx
  3:1  error  '@/widgets/auth' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/app/onboarding/page.tsx
  1:1  error  '@/widgets/onboarding' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/app/onboarding/profile/page.tsx
  1:1  error  '@/widgets/onboarding' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/app/page.tsx
  1:1  error  '@/widgets/home' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다           no-restricted-imports
  2:1  error  '@/widgets/footer' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다         no-restricted-imports
  3:1  error  '@/widgets/header' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다         no-restricted-imports
  4:1  error  '@/widgets/splash-screen' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/features/auth/api/kakaoAuthorize.ts
  13:1  error  '@/shared/api' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/features/auth/api/kakaoLogin.ts
  1:1  error  '@/shared/api' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다     no-restricted-imports
  2:1  error  '@/entities/auth' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/features/auth/index.ts
  3:1  error  '@/entities/auth' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/features/onboarding/api/getCareerLevels.ts
  1:1  error  '@/shared/api' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다           no-restricted-imports
  2:1  error  '@/entities/onboarding' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/features/onboarding/api/getJobs.ts
  1:1  error  '@/shared/api' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다           no-restricted-imports
  2:1  error  '@/entities/onboarding' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/features/onboarding/api/getSkills.ts
  1:1  error  '@/shared/api' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다           no-restricted-imports
  2:1  error  '@/entities/onboarding' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/features/onboarding/api/signup.ts
  1:1  error  '@/shared/api' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다           no-restricted-imports
  3:1  error  '@/entities/onboarding' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/widgets/auth/ui/KakaoCallbackClient.tsx
  6:1  error  '@/features/auth' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/widgets/auth/ui/SocialLoginPage.tsx
  1:1  error  '@/features/auth' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/widgets/header/ui/Header.tsx
  3:1  error  '@/shared/icons/logo.png' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/widgets/home/ui/HomeContent.tsx
  5:1  error  '@/shared/icons/icon-mark.png' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports
  6:1  error  '@/shared/ui/button' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다            no-restricted-imports

/Users/junseopark/re-fit/src/widgets/onboarding/ui/OnboardingProfileForm.tsx
   7:1  error  '@/entities/onboarding' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다           no-restricted-imports
   8:1  error  '@/features/onboarding' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다           no-restricted-imports
   9:1  error  '@/shared/api' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다                    no-restricted-imports
  10:1  error  '@/shared/icons/icon-mark.png' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다    no-restricted-imports
  11:1  error  '@/shared/icons/icon-mark_B.png' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports
  12:1  error  '@/shared/icons/icon_career.png' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports
  13:1  error  '@/shared/icons/Icon_job.png' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다     no-restricted-imports
  14:1  error  '@/shared/icons/Icon_tech.png' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다    no-restricted-imports
  15:1  error  '@/shared/ui/bottom-sheet' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다        no-restricted-imports
  16:1  error  '@/shared/ui/button' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다              no-restricted-imports
  17:1  error  '@/shared/ui/input' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다               no-restricted-imports

/Users/junseopark/re-fit/src/widgets/onboarding/ui/OnboardingRoleSelect.tsx
   7:1  error  '@/shared/ui/button' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다                    no-restricted-imports
   8:1  error  '@/shared/icons/icon-mark.png' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다          no-restricted-imports
   9:1  error  '@/shared/icons/onboarding-expert.png' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports
  10:1  error  '@/shared/icons/onboarding-seeker.png' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

✖ 40 problems (40 errors, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-22 Raw Log

- Logged at: 2026-01-22 12:23:26Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/app/onboarding/layout.tsx
  22:14  error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Users/junseopark/re-fit/src/app/onboarding/layout.tsx:22:14
  20 |   const prevStepRef = useRef(step);
  21 |   const direction =
> 22 |     step === prevStepRef.current ? 'none' : step > prevStepRef.current ? 'forward' : 'back';
     |              ^^^^^^^^^^^^^^^^^^^ Cannot access ref value during render
  23 |
  24 |   useEffect(() => {
  25 |     prevStepRef.current = step;                                        react-hooks/refs
  22:52  error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Users/junseopark/re-fit/src/app/onboarding/layout.tsx:22:52
  20 |   const prevStepRef = useRef(step);
  21 |   const direction =
> 22 |     step === prevStepRef.current ? 'none' : step > prevStepRef.current ? 'forward' : 'back';
     |                                                    ^^^^^^^^^^^^^^^^^^^ Cannot access ref value during render
  23 |
  24 |   useEffect(() => {
  25 |     prevStepRef.current = step;  react-hooks/refs

✖ 2 problems (2 errors, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-22 Raw Log

- Logged at: 2026-01-22 12:24:10Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/app/onboarding/layout.tsx
  22:14  error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Users/junseopark/re-fit/src/app/onboarding/layout.tsx:22:14
  20 |   const prevStepRef = useRef(step);
  21 |   const direction =
> 22 |     step === prevStepRef.current ? 'none' : step > prevStepRef.current ? 'forward' : 'back';
     |              ^^^^^^^^^^^^^^^^^^^ Cannot access ref value during render
  23 |
  24 |   useEffect(() => {
  25 |     prevStepRef.current = step;                                        react-hooks/refs
  22:52  error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Users/junseopark/re-fit/src/app/onboarding/layout.tsx:22:52
  20 |   const prevStepRef = useRef(step);
  21 |   const direction =
> 22 |     step === prevStepRef.current ? 'none' : step > prevStepRef.current ? 'forward' : 'back';
     |                                                    ^^^^^^^^^^^^^^^^^^^ Cannot access ref value during render
  23 |
  24 |   useEffect(() => {
  25 |     prevStepRef.current = step;  react-hooks/refs

✖ 2 problems (2 errors, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-22 Raw Log

- Logged at: 2026-01-22 12:29:41Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/app/onboarding/layout.tsx
  22:14  error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Users/junseopark/re-fit/src/app/onboarding/layout.tsx:22:14
  20 |   const prevStepRef = useRef(step);
  21 |   const direction =
> 22 |     step === prevStepRef.current ? 'none' : step > prevStepRef.current ? 'forward' : 'back';
     |              ^^^^^^^^^^^^^^^^^^^ Cannot access ref value during render
  23 |
  24 |   useEffect(() => {
  25 |     prevStepRef.current = step;                                        react-hooks/refs
  22:52  error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Users/junseopark/re-fit/src/app/onboarding/layout.tsx:22:52
  20 |   const prevStepRef = useRef(step);
  21 |   const direction =
> 22 |     step === prevStepRef.current ? 'none' : step > prevStepRef.current ? 'forward' : 'back';
     |                                                    ^^^^^^^^^^^^^^^^^^^ Cannot access ref value during render
  23 |
  24 |   useEffect(() => {
  25 |     prevStepRef.current = step;  react-hooks/refs

✖ 2 problems (2 errors, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-22 Raw Log

- Logged at: 2026-01-22 12:30:14Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/app/onboarding/layout.tsx
  22:14  error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Users/junseopark/re-fit/src/app/onboarding/layout.tsx:22:14
  20 |   const prevStepRef = useRef(step);
  21 |   const direction =
> 22 |     step === prevStepRef.current ? 'none' : step > prevStepRef.current ? 'forward' : 'back';
     |              ^^^^^^^^^^^^^^^^^^^ Cannot access ref value during render
  23 |
  24 |   useEffect(() => {
  25 |     prevStepRef.current = step;                                        react-hooks/refs
  22:52  error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Users/junseopark/re-fit/src/app/onboarding/layout.tsx:22:52
  20 |   const prevStepRef = useRef(step);
  21 |   const direction =
> 22 |     step === prevStepRef.current ? 'none' : step > prevStepRef.current ? 'forward' : 'back';
     |                                                    ^^^^^^^^^^^^^^^^^^^ Cannot access ref value during render
  23 |
  24 |   useEffect(() => {
  25 |     prevStepRef.current = step;  react-hooks/refs

✖ 2 problems (2 errors, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-24 Raw Log

- Logged at: 2026-01-24 12:59:02Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/features/chat/api/getChatList.ts
  18:14  error  Expected '!==' and instead saw '!='  eqeqeq
  19:12  error  Expected '!==' and instead saw '!='  eqeqeq

/Users/junseopark/re-fit/src/features/chat/api/getChatMessages.ts
  17:14  error  Expected '!==' and instead saw '!='  eqeqeq
  18:12  error  Expected '!==' and instead saw '!='  eqeqeq

/Users/junseopark/re-fit/src/widgets/auth/ui/KakaoCallbackClient.tsx
  50:22  error  Expected '!==' and instead saw '!='  eqeqeq

/Users/junseopark/re-fit/src/widgets/chat-list/ui/ChatList.tsx
  58:24  error  Expected '===' and instead saw '=='  eqeqeq

/Users/junseopark/re-fit/src/widgets/chat-room/ui/ChatRoom.tsx
  102:58  error  Expected '===' and instead saw '=='  eqeqeq
  157:40  error  Expected '!==' and instead saw '!='  eqeqeq

✖ 8 problems (8 errors, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-24 Raw Log

- Logged at: 2026-01-24 12:59:44Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/features/chat/api/getChatList.ts
  18:14  error  Expected '!==' and instead saw '!='  eqeqeq
  19:12  error  Expected '!==' and instead saw '!='  eqeqeq

/Users/junseopark/re-fit/src/features/chat/api/getChatMessages.ts
  17:14  error  Expected '!==' and instead saw '!='  eqeqeq
  18:12  error  Expected '!==' and instead saw '!='  eqeqeq

/Users/junseopark/re-fit/src/widgets/auth/ui/KakaoCallbackClient.tsx
  50:22  error  Expected '!==' and instead saw '!='  eqeqeq

/Users/junseopark/re-fit/src/widgets/chat-list/ui/ChatList.tsx
  58:24  error  Expected '===' and instead saw '=='  eqeqeq

/Users/junseopark/re-fit/src/widgets/chat-room/ui/ChatRoom.tsx
  102:58  error  Expected '===' and instead saw '=='  eqeqeq
  157:40  error  Expected '!==' and instead saw '!='  eqeqeq

✖ 8 problems (8 errors, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-24 Raw Log

- Logged at: 2026-01-24 13:00:52Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/widgets/chat-room/ui/ChatRoom.tsx
  102:58  error  Expected '===' and instead saw '=='  eqeqeq

✖ 1 problem (1 error, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-24 Raw Log

- Logged at: 2026-01-24 14:33:58Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/app/api/auth/kakao/login/route.ts
  10:1  error  '@/features/auth/server' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/features/auth/server/kakaoLogin.server.ts
  13:6  warning  'KakaoLoginResult' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

✖ 2 problems (1 error, 1 warning)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-24 Raw Log

- Logged at: 2026-01-24 14:45:12Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/app/api/auth/kakao/login/route.ts
  10:1  error  '@/features/auth/server' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/features/auth/api/kakaoAuthorize.ts
  13:10  warning  'buildApiUrl' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/Users/junseopark/re-fit/src/features/auth/server/kakaoLogin.server.ts
  13:6  warning  'KakaoLoginResult' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/Users/junseopark/re-fit/src/widgets/auth/ui/KakaoCallbackClient.tsx
   7:10  warning  'stompManager' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  33:14  warning  'result' is defined but never used. Allowed unused args must match /^_/u        @typescript-eslint/no-unused-vars

✖ 5 problems (1 error, 4 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-24 Raw Log

- Logged at: 2026-01-24 16:55:57Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/app/api/auth/kakao/login/route.ts
  3:1  error  '@/features/auth/server' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

/Users/junseopark/re-fit/src/app/api/auth/me/route.ts
  2:1  error  '@/features/auth/server' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

✖ 2 problems (2 errors, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-24 Raw Log

- Logged at: 2026-01-24 19:09:47Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/shared/ui/profile-card/ProfileCard.tsx
  261:16  error    Expected '===' and instead saw '=='                                                                                                                                                                                                                                                      eqeqeq
  261:33  error    Expected '===' and instead saw '=='                                                                                                                                                                                                                                                      eqeqeq
  513:17  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

✖ 3 problems (2 errors, 1 warning)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-26 Raw Log

- Logged at: 2026-01-26 12:20:04Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/app/page.tsx
  6:1  error  '@/widgets/home/ui/SignupConfetti' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

✖ 1 problem (1 error, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-26 Raw Log

- Logged at: 2026-01-26 12:21:04Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/app/page.tsx
  6:1  error  '@/widgets/home/ui/SignupConfetti' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

✖ 1 problem (1 error, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-26 Raw Log

- Logged at: 2026-01-26 12:21:19Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/app/page.tsx
  6:1  error  '@/widgets/home/ui/SignupConfetti' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports

✖ 1 problem (1 error, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-28 Raw Log

- Logged at: 2026-01-28 06:30:10Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/widgets/my-page-edit/ui/MyPageEdit.tsx
  11:1  error    '@/features/onboarding/api/checkNickname' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports
  16:8  warning  'profileBasic' is defined but never used. Allowed unused vars must match /^_/u                                                                          @typescript-eslint/no-unused-vars

✖ 2 problems (1 error, 1 warning)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-28 Raw Log

- Logged at: 2026-01-28 06:30:46Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/widgets/my-page-edit/ui/MyPageEdit.tsx
  11:1  error    '@/features/onboarding/api/checkNickname' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports
  16:8  warning  'profileBasic' is defined but never used. Allowed unused vars must match /^_/u                                                                          @typescript-eslint/no-unused-vars

✖ 2 problems (1 error, 1 warning)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-28 Raw Log

- Logged at: 2026-01-28 06:31:22Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/widgets/my-page-edit/ui/MyPageEdit.tsx
  11:1  error    '@/features/onboarding/api/checkNickname' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports
  16:8  warning  'profileBasic' is defined but never used. Allowed unused vars must match /^_/u                                                                          @typescript-eslint/no-unused-vars

✖ 2 problems (1 error, 1 warning)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-28 Raw Log

- Logged at: 2026-01-28 06:31:45Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/widgets/my-page-edit/ui/MyPageEdit.tsx
  11:1  error    '@/features/onboarding/api/checkNickname' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports
  16:8  warning  'profileBasic' is defined but never used. Allowed unused vars must match /^_/u                                                                          @typescript-eslint/no-unused-vars

✖ 2 problems (1 error, 1 warning)

 ELIFECYCLE  Command failed with exit code 1.
```


### 2026-01-28 Raw Log

- Logged at: 2026-01-28 06:32:15Z

```
> re-fit@0.1.0 lint /Users/junseopark/re-fit
> eslint


/Users/junseopark/re-fit/src/widgets/my-page-edit/ui/MyPageEdit.tsx
  11:1  error    '@/features/onboarding/api/checkNickname' import is restricted from being used by a pattern. FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다  no-restricted-imports
  16:8  warning  'profileBasic' is defined but never used. Allowed unused vars must match /^_/u                                                                          @typescript-eslint/no-unused-vars

✖ 2 problems (1 error, 1 warning)

 ELIFECYCLE  Command failed with exit code 1.
```
