# E2E 테스트 문서 인덱스

이 폴더는 RE-FIT 프론트엔드의 E2E 테스트 구축/운영/CI 연동 과정을 단계별로 기록한다.

## 문서 목적

- 왜 이 구성이 필요한지 배경을 남긴다.
- 누가 봐도 재현 가능한 수준으로 실행 절차를 남긴다.
- 작업 단위를 잘게 쪼개서 변경 이력과 의사결정 근거를 남긴다.

## 문서 구성

- `docs/e2e/README.md`: 문서 운영 원칙, 작성 규칙, 진행 현황
- `docs/e2e/guide.md`: 실행/작성/디버깅/운영 규칙
- `docs/e2e/logs/`: 단계별 상세 작업 로그

## 작성 원칙

- 작업 시작 전: 해당 단계 로그 파일을 먼저 만든다.
- 작업 중: 변경한 파일/명령어/실패 원인을 즉시 기록한다.
- 작업 종료 후: 검증 결과, 남은 리스크, 다음 단계까지 기록한다.
- 모든 로그는 절대 날짜(`YYYY-MM-DD`)와 실행 환경(Node/pnpm)을 명시한다.
- 모든 로그에 `트러블슈팅 타임라인`과 `고충/의사결정 메모`를 반드시 포함한다.

## 로그 파일 규칙

- 파일명: `step-XX-<slug>.md`
- 예시: `step-01-playwright-bootstrap.md`
- 각 파일은 아래 섹션을 반드시 포함한다.
  - 배경 및 목표
  - 범위(포함/제외)
  - 수행 작업(순서대로)
  - 변경 파일 상세
  - 실행 명령어와 결과
  - 이슈 및 대응
  - 트러블슈팅 타임라인
  - 고충/의사결정 메모
  - 검증 체크리스트
  - 다음 단계 인수인계

## 진행 현황

- [x] Step 01: Playwright 기본 세팅 + smoke 테스트 1개 구축
- [x] Step 02: mock/fixture 레이어 구축
- [x] Step 03: 핵심 시나리오 확장(`@smoke`, `@critical`, `@error`)
- [x] Step 04: CI 연동 및 artifact 업로드
- [x] Step 05: 운영 가이드/안정화 규칙 문서화
- [x] Step 06: Resume 비동기 플로우 테스트 확장
- [x] Step 07: Experts 비동기 플로우 테스트 확장
- [x] Step 08: Report 비동기 플로우 테스트 확장
- [x] Step 09: Chat 비동기 플로우 테스트 확장
- [x] Step 10: E2E 운영 안정화(스모크 분리/CI 실행 전략)
- [x] Step 11: 피드백 요청 → 설문 제출 → 리포트 생성 종단 시나리오

## 로그 목록

- Guide: [guide.md](./guide.md)
- Step 01: [step-01-playwright-bootstrap.md](./logs/step-01-playwright-bootstrap.md)
- Step 02: [step-02-mock-fixture-foundation.md](./logs/step-02-mock-fixture-foundation.md)
- Step 03: [step-03-login-flow-scenarios.md](./logs/step-03-login-flow-scenarios.md)
- Step 04: [step-04-ci-e2e-integration.md](./logs/step-04-ci-e2e-integration.md)
- Step 05: [step-05-operations-guide.md](./logs/step-05-operations-guide.md)
- Step 06: [step-06-resume-async-coverage.md](./logs/step-06-resume-async-coverage.md)
- Step 07: [step-07-experts-async-coverage.md](./logs/step-07-experts-async-coverage.md)
- Step 08: [step-08-report-async-coverage.md](./logs/step-08-report-async-coverage.md)
- Step 09: [step-09-chat-async-coverage.md](./logs/step-09-chat-async-coverage.md)
- Step 10: [step-10-e2e-operations-stabilization.md](./logs/step-10-e2e-operations-stabilization.md)
- Step 11: [step-11-feedback-report-journey.md](./logs/step-11-feedback-report-journey.md)
- Troubleshooting Index: [troubleshooting.md](./troubleshooting.md)
- Template: [\_template.md](./logs/_template.md)
