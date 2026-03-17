# Step 08 - Report 비동기 플로우 테스트 확장

## 1) 배경 및 목표

### 배경

- Experts 단계까지 완료됐지만 Report 도메인은 목록/상세/삭제의 비동기 전이를 E2E로 충분히 방어하지 못했다.
- Report는 삭제(confirm + DELETE + 목록 갱신)처럼 사용자 액션과 비동기 응답이 이어지는 구간이 있어 회귀 위험이 높다.

### 목표

- Report 도메인 `@critical`/`@error` 시나리오를 추가한다.
- 로딩 상태, 상세 렌더, 삭제 후 목록 반영, 실패 메시지 노출을 검증한다.
- 작업 중 발생한 실패 원인과 해결 과정을 문서화한다.

## 2) 범위

### 포함

- Report mock/helper 추가
- Report `@critical` 테스트 추가(목록/상세/삭제)
- Report `@error` 테스트 추가(목록/상세)
- 전체 E2E 회귀 실행 및 실패 원인 대응

### 제외

- Chat 도메인 E2E 확장
- 성능/부하 테스트
- CI 워크플로우 구조 변경

## 3) 수행 작업 (시간 순서)

1. Report 페이지/훅 비동기 흐름 분석

- 목록 조회, 상세 조회, 삭제 confirm + invalidate/refetch 흐름 확인

2. Report mock 레이어 추가

- `tests/e2e/mocks/report.ts` 신규 작성
- 목록/상세/삭제 성공/실패 응답 helper 정리

3. fixture API 확장

- `tests/e2e/fixtures/e2e.ts`에 report mock 메서드 연결

4. Report 시나리오 추가

- `tests/e2e/critical/report-async.spec.ts` 3건 작성
- `tests/e2e/error/report-error.spec.ts` 2건 작성

5. 전체 회귀 실행 중 실패 대응

- 1차 실행에서 19 passed, 1 failed 확인
- 삭제 버튼 locator strict mode 충돌 원인 파악
- locator를 exact 매칭으로 수정

6. 전체 재검증

- 2차 실행에서 20 passed 확인

## 4) 변경 파일 상세

### 4.1 `tests/e2e/mocks/report.ts` (신규)

- `createReportSummary`, `createReportDetail` builder 추가
- `mockReportsList`, `mockReportDetail`, `mockDeleteReport`
- `mockReportsListError`, `mockReportDetailError`

### 4.2 `tests/e2e/fixtures/e2e.ts` (수정)

- `apiMocks`에 report helper 연결
  - `reportsList`, `reportDetail`, `deleteReportSuccess`
  - `reportsListError`, `reportDetailError`

### 4.3 `tests/e2e/critical/report-async.spec.ts` (신규/수정)

- 목록 로딩 -> 렌더 검증
- 상세 로딩 -> final comment 렌더 검증
- 삭제 confirm 후 목록 갱신 검증
- 실패 대응으로 삭제 버튼 locator를 `exact: true`로 보강

### 4.4 `tests/e2e/error/report-error.spec.ts` (신규)

- 목록 실패 시 에러 문구 검증
- 상세 실패 시 에러 문구 검증

## 5) 실행 명령어와 결과

1. 전체 실행 (1차)

```bash
nvm use 20
pnpm test:e2e
```

- 결과: 19 passed, 1 failed
- 실패: `@critical report async flows > deletes report after confirm and removes it from list`

2. locator 수정 후 전체 재실행

```bash
nvm use 20
pnpm test:e2e
```

- 결과: 20 passed

## 6) 이슈 및 대응

### 이슈 A: 삭제 버튼 locator strict mode 충돌

- 현상: `getByRole('button', { name: '삭제' })`가 2개 버튼에 동시에 매칭되어 click 실패
- 원인: 카드 버튼 이름(`삭제 대상 리포트 ...`)이 부분 문자열로 `삭제`를 포함
- 대응: `getByRole('button', { name: '삭제', exact: true })`로 엄격 매칭

## 7) 트러블슈팅 타임라인

1. 증상:

- Step 08 1차 전체 실행에서 report 삭제 테스트만 실패

2. 확인한 가설:

- 가설 A: 삭제 API mock 자체가 미매칭
- 가설 B: 삭제 액션 locator가 의도와 다르게 다중 매칭

3. 시도한 조치:

- 실패 로그에서 strict mode violation 확인
- 매칭된 2개 요소의 accessible name 비교
- 삭제 메뉴 버튼 locator를 exact 매칭으로 변경

4. 최종 원인:

- 삭제 텍스트의 부분 매칭 때문에 다른 버튼까지 함께 선택됨

5. 최종 해결:

- exact 매칭 적용 후 삭제 시나리오/전체 스위트 모두 통과

## 8) 고충/의사결정 메모

- 당시 가장 헷갈렸던 지점: 삭제 API/상태 갱신 문제처럼 보였지만 실제 실패 지점은 클릭 직전 locator 선택이었다.
- 버린 접근: 강제 `.nth(1)`로 통과만 맞추는 방식(구조 변경에 취약).
- 채택한 접근: 접근성 이름 기준 strict/exact 매칭으로 의도를 명확히 표현.
- 다음 단계에서 같은 문제를 피하는 방법: 메뉴 액션은 `exact: true` 또는 컨테이너 scope locator를 기본 규칙으로 사용.

## 9) 검증 체크리스트

- [x] Report `@critical` 3건 추가 완료
- [x] Report `@error` 2건 추가 완료
- [x] 전체 E2E 통과(20 passed)

## 10) 다음 단계 인수인계

- 목표
  - Chat 도메인 비동기/에러 플로우까지 E2E를 확장해 핵심 사용자 여정을 보강한다.
- 해야 할 일
  1. chat 목록/상세 로딩 시나리오 추가
  2. chat 요청 생성/전송 실패 시나리오 추가
  3. flaky 우려 구간(폴링/디바운스) 안정화 규칙 문서화
- 완료 기준
  - chat 핵심 비동기 흐름이 `@critical`/`@error`로 회귀 방어됨
