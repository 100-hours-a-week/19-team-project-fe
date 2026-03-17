# Step 04 - CI E2E 연동 및 아티팩트 업로드

## 1) 배경 및 목표

### 배경

- Step 03까지 로컬 E2E 시나리오는 준비되었지만 PR 단계에서 자동 실행되지 않는다.
- 실패 시 디버깅 정보를 수집하지 못하면 회귀 원인 분석 시간이 길어진다.

### 목표

- CI에 E2E job을 추가해 PR/push에서 자동 검증되도록 구성한다.
- 실패 여부와 무관하게 Playwright report/artifact를 업로드한다.
- 현재 CI 트리거 제약(`paths-ignore`)을 문서에 명확히 남긴다.

## 2) 범위

### 포함

- `.github/workflows/ci.yml`에 E2E job 추가
- Playwright browser 설치 단계 추가
- E2E 결과물 artifact 업로드 단계 추가

### 제외

- GitHub branch protection(required check) 실제 설정 변경
- 워크플로우 분리(별도 `e2e.yml` 생성)

## 3) 수행 작업 (시간 순서)

1. 기존 CI 구조 분석

- `.github/workflows/ci.yml` 트리거와 job 구조 확인
- 확인 결과: `pull_request`/`push` 모두 `paths-ignore: '.github/workflows/**'` 설정 존재

2. workflow_dispatch 입력 확장

- 수동 실행 선택지에 `e2e` 옵션 추가
- 목적: 워크플로우 파일 수정만 있는 PR에서도 수동 검증 가능하도록 보완

3. E2E job 추가

- job 이름: `e2e`
- 실행 조건
  - `pull_request`
  - `push` (`develop`, `main`)
  - `workflow_dispatch` (`e2e`, `all`)
- 실행 단계
  - checkout
  - setup-pnpm composite action
  - `pnpm exec playwright install --with-deps chromium`
  - `pnpm run test:e2e` (`CI=true`)

4. 아티팩트 업로드 구성

- 테스트 성공/실패와 무관하게(`if: always()`) 업로드
  - `playwright-report/`
  - `test-results/`
- retention: 14일

5. 로컬 문법 검증

- `pnpm exec prettier --check .github/workflows/ci.yml`로 YAML 형식 확인
- 결과: 통과

## 4) 변경 파일 상세

### 4.1 `.github/workflows/ci.yml` (수정)

- `workflow_dispatch.inputs.job_to_run.options`에 `e2e` 추가
- `e2e` job 신규 추가
  - Playwright 브라우저 설치
  - E2E 실행
  - report/result artifact 업로드

## 5) 실행 명령어와 결과

1. CI 워크플로우 YAML 형식 점검

```bash
pnpm exec prettier --check .github/workflows/ci.yml
```

- 결과: `All matched files use Prettier code style!`

## 6) 이슈 및 대응

### 이슈 A: 워크플로우 파일 변경만으로는 CI가 자동 트리거되지 않는 제약

- 현상: `ci.yml`에서 `paths-ignore: '.github/workflows/**'`가 설정되어 있음
- 원인: 기존 저장소 정책상 workflow 파일 경로 변경은 자동 실행 제외
- 대응:
  - 이 제약을 Step 04 로그와 troubleshooting 문서에 명시
  - `workflow_dispatch`에 `e2e` 옵션을 추가해 수동 실행 경로 제공

## 7) 트러블슈팅 타임라인

1. 증상:

- CI 설정을 바꿨는데도 해당 변경 커밋만으로 자동 실행 보장이 되지 않음

2. 확인한 가설:

- 가설 A: GitHub Actions 캐시/반영 지연 문제
- 가설 B: 이벤트 필터(`paths-ignore`)에 의해 트리거가 제외됨

3. 시도한 조치:

- `ci.yml` 트리거 섹션 정독
- `pull_request`, `push` 모두 `paths-ignore` 조건 확인
- 수동 실행 경로를 위해 `workflow_dispatch` 옵션 확장

4. 최종 원인:

- 캐시 문제가 아니라 명시적 `paths-ignore` 설정이 원인

5. 최종 해결:

- 정책은 유지하되, 수동 실행 가능한 `e2e` 옵션을 workflow_dispatch에 추가
- 문서에 제약사항을 운영 리스크로 남김

## 8) 고충/의사결정 메모

- 당시 가장 헷갈렸던 지점: CI 수정 후 자동 트리거가 안 되는 것이 설정 반영 지연처럼 보였던 점.
- 버린 접근: `paths-ignore`를 즉시 제거하는 방식(기존 릴리즈 정책 영향 가능성).
- 채택한 접근: 정책 유지 + 수동 실행 옵션 보강 + 문서화.
- 다음 단계에서 같은 문제를 피하는 방법: CI 변경 PR은 workflow_dispatch로 즉시 검증하고, 필요 시 별도 정책 변경 PR로 분리.

## 9) 검증 체크리스트

- [x] CI E2E job 추가 완료
- [x] artifact 업로드 단계 추가 완료
- [x] 로컬 워크플로우 YAML 문법 검토 완료

## 10) 다음 단계 인수인계

- 목표
  - E2E 운영 가이드를 마무리하고 팀 온보딩 문서를 완성한다.
- 해야 할 일
  1. `docs/e2e`에 실행 가이드(로컬/CI/디버깅) 정리
  2. mock 작성 규칙 및 네이밍 규칙 문서화
  3. flaky 방지 규칙(대기 전략, selector 규칙) 문서화
  4. required check 적용 절차 정리
- 완료 기준
  - 신규 팀원이 문서만 보고 E2E 작성/실행/디버깅 가능
