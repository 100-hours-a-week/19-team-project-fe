# ESLint / Prettier 설정 정리

## 목적
- 코드 품질(ESLint)과 스타일(Prettier)을 분리해 일관성을 유지한다.
- 스타일 충돌을 줄이고 팀 내 동일한 포맷을 강제한다.

## ESLint 설정
### 적용 룰
- `eqeqeq`: `error` (=== 사용 강제)
- `prefer-const`: `error` (재할당 없는 변수는 const)
- `@typescript-eslint/no-unused-vars`: `warn` (`_` 접두사는 무시)
- `@typescript-eslint/no-explicit-any`: `off` (any 허용)
- `@typescript-eslint/explicit-function-return-type`: `off` (반환 타입 명시 선택)

### Prettier 충돌 방지
`eslint-config-prettier`를 추가해 포맷 관련 ESLint 룰을 비활성화한다.  
스타일은 Prettier가 담당하고, ESLint는 코드 품질에 집중한다.

## Prettier 설정
- `trailingComma`: `all`
- `tabWidth`: `2`
- `semi`: `true`
- `singleQuote`: `true`
- `bracketSpacing`: `true`
- `bracketSameLine`: `false`
- `printWidth`: `100`

## 사용 방법
- 린트: `pnpm lint`
- 포맷: `pnpm format`
  - 범위: `src/**/*.{ts,tsx,js,jsx,css,md,json}`

## 트러블슈팅
### react-hooks/immutability 에러
훅에서 반환된 값을 직접 수정하면 에러가 발생한다.  
가능하면 생성 시점에 설정하거나 새 객체를 만들어 교체한다.

