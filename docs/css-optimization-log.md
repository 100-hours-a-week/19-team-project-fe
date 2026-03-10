# CSS 최적화 작업 로그 (Tailwind 중심)

## 작업 목적
- `globals.css`에 모여 있던 페이지/위젯 전용 스타일을 분리해 전역 책임을 축소한다.
- 스택 전환 애니메이션의 `left` 기반 렌더링을 `transform` 기반으로 바꿔 레이아웃 비용을 줄인다.
- 반복되는 Tailwind arbitrary value를 토큰으로 치환해 CSS 생성 규칙 수와 유지보수 비용을 줄인다.

## 측정 지표
1. CSS 번들 크기(`raw/gzip/brotli`)
2. 전역 CSS 책임도(`globals.css` 라인 수, 클래스 셀렉터 수, 페이지/위젯 전용 셀렉터 수)
3. Tailwind arbitrary value 사용량(총/고유)

## 변경 전 기준선
- 측정 시점: 리팩터링 전
- 지표 1
  - `.next/static/chunks/e35ab10e3e032e31.css`
  - `raw 68,593B / gzip 12,976B / brotli 10,666B`
- 지표 2 (`src/app/globals.css`)
  - 라인 수: `324`
  - 클래스 셀렉터 수: `28`
  - 페이지/위젯 전용 셀렉터 수(휴리스틱): `26`
- 지표 3 (Tailwind prefix 기준 정제)
  - arbitrary 총 개수: `567`
  - arbitrary 고유 개수: `333`

## 수행한 작업
### 1) 전역 스타일 분리
- `BottomSheet` 전용 애니메이션을 로컬 모듈로 이동
  - `src/shared/ui/bottom-sheet/BottomSheet.module.css`
  - `src/shared/ui/bottom-sheet/BottomSheet.tsx`
- `PageTransition` 전용 애니메이션을 로컬 모듈로 이동
  - `src/shared/ui/page-transition/PageTransition.module.css`
  - `src/shared/ui/page-transition/PageTransition.tsx`
- 스택 전환 스타일을 각 라우트/위젯 로컬 모듈로 이동
  - `src/app/onboarding/layout.module.css`
  - `src/widgets/chat/ui/ChatStack.module.css`
  - `src/widgets/report/ui/ReportStack.module.css`
  - `src/widgets/resume/ui/ResumeStack.module.css`
- 온보딩 폼 stagger 애니메이션을 컴포넌트 인접 CSS Module로 이동
  - `src/widgets/onboarding/ui/OnboardingProfileForm.module.css`

### 2) `left` -> `transform` 애니메이션 전환
- 스택 전환 키프레임을 `left` 이동에서 `translateX` 이동으로 교체
- 적용 대상
  - `src/app/onboarding/layout.tsx`
  - `src/widgets/chat/ui/ChatStack.tsx`
  - `src/widgets/report/ui/ReportStack.tsx`
  - `src/widgets/resume/ui/ResumeStack.tsx`

### 3) Tailwind 토큰화
- `tailwind.config.ts`에 공통 토큰 추가
  - 색상: `brand.primary`, `brand.soft`, `brand.border`
  - 그림자: `shadow-card-soft`
  - 폰트 크기: `text-2xs`
  - 애니메이션: `animate-story-progress`, `animate-fade-in`, `animate-float`
- 반복 arbitrary 클래스 치환(프로젝트 전반)
  - `text-[#2b4b7e]` -> `text-brand-primary`
  - `bg-[#edf4ff]` -> `bg-brand-soft`
  - `border-[#2b4b7e]` -> `border-brand-primary`
  - `border-[#bcd1f5]` -> `border-brand-border`
  - `shadow-[0_10px_30px_rgba(0,0,0,0.04)]` -> `shadow-card-soft`
  - `text-[11px]` -> `text-2xs`

## 변경 후 측정
- 측정 시점: 리팩터링 후
- 지표 1
  - 산출 CSS 파일이 1개 -> 3개로 분리
  - `8019f71688709d5c.css`: `raw 66,665B / gzip 12,622B / brotli 10,365B`
  - `01d64b690a12c7d6.css`: `raw 3,925B / gzip 725B / brotli 598B`
  - `42e4eae21d718b23.css`: `raw 618B / gzip 258B / brotli 185B`
  - 합계: `raw 71,208B / gzip 13,605B / brotli 11,148B`
- 지표 2 (`src/app/globals.css`)
  - 라인 수: `120` (324 -> 120)
  - 클래스 셀렉터 수: `5` (28 -> 5)
  - 페이지/위젯 전용 셀렉터 수(휴리스틱): `0` (26 -> 0)
- 지표 3 (Tailwind prefix 기준 정제)
  - arbitrary 총 개수: `386` (567 -> 386)
  - arbitrary 고유 개수: `282` (333 -> 282)

## 해석
- 전역 CSS 책임 축소 목표는 달성했다.
- arbitrary value 사용량도 의미 있게 감소했다.
- 전체 CSS 합계 크기는 소폭 증가했지만, 전역 단일 파일이 분리되어 라우트별 로딩 구조로 바뀌었다.
  - 가장 큰 단일 청크는 감소(`68,593B -> 66,665B`)했다.
  - 추가 청크는 라우트/컴포넌트 단위로 필요 시 로드되는 성격이다.

## 검증
- `pnpm lint` 통과
- `pnpm build` 통과 (Node 20.20.0)
