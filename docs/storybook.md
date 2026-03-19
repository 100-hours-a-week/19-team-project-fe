# Storybook 운영 가이드

## 목적
- shared UI를 독립적으로 검증한다.
- 컴포넌트 상태(variant/state)를 문서화한다.
- 상호작용(play) 테스트를 CI에서 자동 검증한다.

## 실행 명령
- 개발 서버: `pnpm storybook`
- CI 서버(비대화형): `pnpm storybook:ci-server`
- 정적 빌드: `pnpm build-storybook`
- 테스트 러너(로컬 Storybook 대상): `pnpm test-storybook -- --url http://127.0.0.1:6006`
- 테스트 러너(CI 방식): `pnpm test-storybook:ci`
- 커버리지 감사: `pnpm storybook:audit`

## 품질 기준
- `src/shared/ui`의 모든 컴포넌트 슬라이스는 `.stories.tsx`를 가진다.
- 각 스토리 파일은 최소 1개 이상의 `play` 상호작용 검증을 가진다.
- 주요 상태를 분리해서 스토리로 명시한다.
- 주요 컴포넌트는 `argTypes`를 정의해 Controls playground를 제공한다.
- `parameters.docs.description.component`에 사용 맥락(언제/왜 사용)을 작성한다.
- 접근성 검증은 `a11y.test = error`로 CI 실패 조건으로 관리한다.

## Node 버전
- Storybook 10 기준 Node.js `20.19+` 또는 `22.12+`가 필요하다.
- 저장소 기본 버전은 `.nvmrc`의 `20`을 따른다.

## 권장 CI 단계
1. `pnpm install --frozen-lockfile`
2. `pnpm storybook:audit`
3. `pnpm build-storybook`
4. `pnpm test-storybook:ci`
