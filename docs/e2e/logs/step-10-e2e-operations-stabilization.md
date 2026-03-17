# Step 10 - E2E 운영 안정화(스모크 분리/CI 실행 전략)

## 1) 배경 및 목표

### 배경

- 도메인 확장으로 E2E 테스트가 25개까지 증가했다.
- PR마다 전체 E2E를 항상 수행하면 피드백 지연과 flaky 대응 비용이 커진다.

### 목표

- 실행 스코프를 `smoke/critical/error/full`로 분리한다.
- CI에서 이벤트별(PR/push/수동) E2E 실행 전략을 명확히 적용한다.
- 운영 문서와 로그에 규칙/의사결정을 상세 기록한다.

## 2) 범위

### 포함

- package script 분리
- CI `e2e_scope` 입력 및 실행 분기 추가
- guide/README/troubleshooting/step log 문서 업데이트

### 제외

- 테스트 시나리오 추가(기능 범위 확장)
- Playwright 프로젝트 다중 브라우저 확장

## 3) 수행 작업 (시간 순서)

1. 운영 병목 분석

- PR 단계에서 전체 E2E를 매번 실행하는 구조의 한계 정리
- smoke 최소셋을 빠른 required check로 사용하는 전략 확정

2. 실행 스크립트 분리

- `test:e2e:smoke`, `test:e2e:critical`, `test:e2e:error` 추가

3. CI 실행 전략 반영

- `workflow_dispatch`에 `e2e_scope(smoke|full)` 입력 추가
- `e2e` job에서 이벤트별 실행 명령 분기
  - PR: smoke
  - push: full
  - 수동: 선택값

4. artifact 네이밍 개선

- 업로드 파일명에 `smoke/full` 스코프 포함

5. 운영 문서 보강

- `guide.md`에 새 명령어/selector 안정화/CI 스코프 정책 반영

## 4) 변경 파일 상세

### 4.1 `package.json` (수정)

- E2E 실행 스크립트 3개 추가
  - `test:e2e:smoke`
  - `test:e2e:critical`
  - `test:e2e:error`

### 4.2 `.github/workflows/ci.yml` (수정)

- `workflow_dispatch` input 추가: `e2e_scope`
- `Decide E2E Scope` 단계 추가
- `Run E2E Tests`를 결정된 커맨드로 실행
- artifact 명에 실행 스코프 포함

### 4.3 `docs/e2e/guide.md` (수정)

- 분리 실행 명령어 추가
- strict locator 충돌 방지 규칙(`exact`/scope) 추가
- CI 스코프 정책(PR=smoke, push=full, 수동 선택) 반영

## 5) 실행 명령어와 결과

1. smoke 실행 검증

```bash
nvm use 20
pnpm run test:e2e:smoke
```

- 결과: 통과

2. 전체 실행 회귀 확인

```bash
nvm use 20
pnpm test:e2e
```

- 결과: 25 passed

## 6) 이슈 및 대응

### 이슈 A: 테스트 개수 증가에 따른 PR 피드백 지연 위험

- 현상: 도메인 확장으로 전체 E2E 실행시간 증가
- 원인: 단일 실행 전략(항상 full)
- 대응: PR은 smoke만 빠르게 검증하고, push는 full로 회귀 보장

### 이슈 B: 수동 실행 시 목적별 스코프 제어 부족

- 현상: 운영자가 smoke/full 중 원하는 범위를 즉시 선택하기 어려움
- 원인: workflow_dispatch 입력값에 실행 스코프가 없었음
- 대응: `e2e_scope` 입력을 추가해 수동 실행 제어 가능하게 변경

## 7) 트러블슈팅 타임라인

1. 증상:

- 테스트 확장 이후 PR 대기시간 증가 우려가 반복적으로 제기됨

2. 확인한 가설:

- 가설 A: 전체 회귀를 PR에서 항상 강제하면 팀 생산성이 떨어진다.
- 가설 B: smoke를 먼저 통과시키고 full을 후속 보장해도 품질을 유지할 수 있다.

3. 시도한 조치:

- 이벤트별 실행 정책 정의(PR/push/수동)
- CI에서 scope 결정 step을 추가
- artifact에 scope를 붙여 장애 분석 시 혼선을 줄임

4. 최종 원인:

- 실행 스코프 정책 부재가 운영 병목의 핵심 원인

5. 최종 해결:

- smoke/full 분기 전략을 코드(CI)와 문서(guide)에 함께 고정

## 8) 고충/의사결정 메모

- 당시 가장 헷갈렸던 지점: PR에서 얼마나 줄여도 품질 리스크가 없는지 기준 설정.
- 버린 접근: PR에서도 full을 강제하고 단순 worker 튜닝으로만 해결.
- 채택한 접근: PR smoke / push full의 이중 방어.
- 다음 단계에서 같은 문제를 피하는 방법: 신규 테스트 추가 시 `@smoke` 승격 기준을 함께 리뷰.

## 9) 검증 체크리스트

- [x] e2e script 분리 완료
- [x] CI e2e scope 분기 반영 완료
- [x] 운영 가이드 반영 완료
- [x] smoke/전체 실행 검증 완료

## 10) 다음 단계 인수인계

- 목표
  - Step 11에서 도메인별 smoke 승격 기준을 정교화한다.
- 해야 할 일
  1. smoke 후보 시나리오 목록화(로그인/리포트/채팅 핵심 진입)
  2. flaky 케이스를 smoke에서 제외하고 critical로 유지
  3. CI required check 정책(브랜치 보호) 최종 적용
- 완료 기준
  - PR에서 빠른 안정 신호(smoke)와 push에서 전체 회귀(full)가 일관되게 동작
