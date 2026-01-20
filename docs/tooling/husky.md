# Husky 설정 정리

## 목적

- 커밋 단계에서 자동으로 코드 품질 체크를 수행한다.
- 팀원별 환경 차이로 인한 누락을 방지한다.

## 현재 설정

### 설치 및 초기화

- 패키지 설치: `husky`
- `prepare` 스크립트로 훅 설치 자동화

### 적용 훅

- `pre-commit`
  - 실행: `pnpm format && pnpm lint`
  - 포맷 대상: `src/**/*.{ts,tsx,js,jsx,css,md,json}`
- `commit-msg`
  - 실행: `npx commitlint --edit "$1"`

## 동작 방식

- 커밋 시점에 포맷과 린트가 순차 실행된다.
- 실패하면 커밋이 중단된다.
- 커밋 메시지 규칙을 위반하면 커밋이 중단된다.

## commitlint 설정

### 설정 파일

- `commitlint.config.cjs`

### 적용 규칙

- 타입은 소문자만 허용: `type-case`
- 타입 허용 목록: `build`, `chore`, `content`, `docs`, `feat`, `fix`, `refactor`, `style`, `test`, `deploy`
- 제목 끝에 마침표 금지: `subject-full-stop`
- 제목 최소 길이: 5자 이상
- 제목 최대 길이: 72자 이하
- 제목 대소문자 허용 범위:
  - `sentence-case`
  - `start-case`
  - `pascal-case`
  - `upper-case`
  - `lower-case`

### 예시

```text
feat: Add kakao login button
fix: Resolve lanyard texture mutation
chore: Update husky hooks
```

## 트러블슈팅

### 커밋이 막히는 경우

- `pre-commit` 훅이 실패하면 커밋이 중단된다.
- 흔한 원인: 실행 스크립트 부재, 린트 에러, 포맷 에러.

### 커밋 메시지가 거절되는 경우

- `commit-msg` 훅에서 `commitlint` 규칙을 위반하면 거절된다.
- 메시지 타입/길이/대소문자 규칙을 확인하고 수정한다.
- 적용 중인 규칙 요약:
  - 타입은 소문자이며 허용 목록 내여야 한다:
    - `build`, `chore`, `content`, `docs`, `feat`, `fix`, `refactor`, `style`, `test`, `deploy`
  - 제목은 5자 이상, 72자 이하이다.
  - 제목 끝에 `.`을 사용할 수 없다.
  - 제목 대소문자는 다음 중 하나여야 한다:
    - `sentence-case`, `start-case`, `pascal-case`, `upper-case`, `lower-case`

### 기본 pre-commit 스크립트 문제

- Husky 초기화 시 기본 `pre-commit`은 `pnpm test`로 생성될 수 있다.
- 프로젝트에 `test` 스크립트가 없으면 실패하므로 원하는 스크립트로 변경한다.
