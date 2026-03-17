# Step 07 - Experts 비동기 플로우 테스트 확장

## 1) 배경 및 목표

### 배경

- Resume까지 확장했지만 Experts 도메인은 아직 비동기 회귀 방어가 부족하다.
- Experts는 검색/상세/리뷰 페이지네이션 등 비동기 전이가 많아 안정적인 E2E가 필요하다.

### 목표

- Experts 도메인 비동기 시나리오를 `@critical`/`@error`로 추가한다.
- 로딩 상태, 상세 로드, 리뷰 더보기(페이지네이션), 실패 처리까지 검증한다.
- 작업 과정의 트러블슈팅과 의사결정을 로그로 남긴다.

## 2) 범위

### 포함

- Experts mock helper 추가
- Experts `@critical` 테스트 추가
- Experts `@error` 테스트 추가

### 제외

- 채팅 요청 생성 플로우 E2E
- 추천 알고리즘 품질 검증
- CI 워크플로우 수정

## 3) 수행 작업 (시간 순서)

1. Experts 비동기 흐름 분석

- 검색(`useExpertSearch`)의 디바운스/제출 흐름 확인
- 상세(`useExpertDetail`) 로딩/에러 전이 확인
- 리뷰(`useExpertReviews`) 페이지네이션(load more) 흐름 확인

2. Experts mock helper 추가

- `tests/e2e/mocks/experts.ts` 신설
- 목록/상세/리뷰/에러 응답 helper 작성

3. `@critical` 시나리오 추가

- 검색 시 로딩 상태 후 결과 렌더
- 상세 로드 후 리뷰 더보기(페이지네이션) 반영
- 제출 검색에서 빈 결과 상태 노출

4. `@error` 시나리오 추가

- 검색 API 실패 시 에러 문구 노출
- 상세 API 실패 시 에러 문구 노출

5. 공통 mock 라우팅 보강

- `mockJsonRoute`가 쿼리스트링 URL을 매칭하지 못하는 문제 확인
- 경로 매칭을 `path + optional query` 정규식으로 수정

6. 전체 회귀 검증

- 단일 실패 spec 재검증 후 통과
- 전체 E2E 15개 테스트 통과

## 4) 변경 파일 상세

### 4.1 `tests/e2e/mocks/experts.ts` (신규)

- Experts 도메인 mock builder 추가
  - `createExpert`, `createExpertDetail`, `createExpertReview`
  - `mockExpertsSearch`, `mockExpertDetail`, `mockExpertReviews`
  - `mockExpertsSearchError`, `mockExpertDetailError`

### 4.2 `tests/e2e/mocks/http.ts` (수정)

- `mockJsonRoute` URL 매칭 보강
  - 기존: path exact pattern
  - 변경: `path + optional query` 정규식 매칭
- 목적: `/api/v1/experts?keyword=...` 같은 쿼리 URL mock 누락 방지

### 4.3 `tests/e2e/critical/experts-async.spec.ts` (신규)

- Experts 비동기 핵심 시나리오 3건 추가

### 4.4 `tests/e2e/error/experts-error.spec.ts` (신규)

- Experts 에러 시나리오 2건 추가

## 5) 실행 명령어와 결과

1. 테스트 목록 확인

```bash
nvm use 20
pnpm test:e2e --list
```

- 결과: 총 15개 테스트 인식

2. 1차 전체 실행

```bash
nvm use 20
pnpm test:e2e
```

- 결과: 14 passed, 1 failed
- 실패: experts 검색 에러 케이스에서 mock 미매칭

3. 단일 실패 테스트 재검증

```bash
nvm use 20
pnpm exec playwright test tests/e2e/error/experts-error.spec.ts
```

- 결과: 2 passed

4. 수정 후 전체 재실행

```bash
nvm use 20
pnpm test:e2e
```

- 결과: 15 passed

## 6) 이슈 및 대응

### 이슈 A: 쿼리스트링 포함 URL mock 미매칭

- 현상: experts 검색 에러 테스트에서 기대한 에러 문구가 노출되지 않음
- 원인: `mockJsonRoute`가 `/api/v1/experts`는 매칭하지만 `/api/v1/experts?keyword=...`는 매칭 실패
- 대응: URL 매칭을 `path + optional query` 정규식으로 변경

## 7) 트러블슈팅 타임라인

1. 증상:

- `shows search error message when experts query fails` 테스트 실패

2. 확인한 가설:

- 가설 A: 컴포넌트 에러 핸들링 분기 문제
- 가설 B: 검색 요청 URL이 mock에 매칭되지 않음

3. 시도한 조치:

- 실패 테스트 단독 실행으로 재현
- mock 경로 매칭 로직 확인
- `mockJsonRoute`를 쿼리스트링 허용 정규식 매칭으로 수정

4. 최종 원인:

- 쿼리스트링이 포함된 URL이 공통 mock 라우터에 매칭되지 않았음

5. 최종 해결:

- 공통 라우팅 매칭 로직 보강 후 단독/전체 테스트 모두 통과

## 8) 고충/의사결정 메모

- 당시 가장 헷갈렸던 지점: 도메인 테스트 실패처럼 보였지만 실제 원인은 공통 mock 매처였던 점.
- 버린 접근: experts spec에서만 임시 패턴 추가로 해결하는 방식.
- 채택한 접근: 공통 `mockJsonRoute`를 수정해 모든 도메인에 일관 적용.
- 다음 단계에서 같은 문제를 피하는 방법: query param이 있는 API는 공통 매처가 커버하는지 먼저 확인.

## 9) 검증 체크리스트

- [x] Experts `@critical` 추가 완료
- [x] Experts `@error` 추가 완료
- [x] 전체 E2E 통과(15 passed)

## 10) 다음 단계 인수인계

- 목표
  - Report/Chat 도메인까지 비동기 회귀 범위를 확장한다.
- 해야 할 일
  1. report 리스트/상세/삭제 성공·실패 테스트 추가
  2. chat 리스트/상세/요청·전송 실패 테스트 추가
  3. 필요 시 `@smoke` 최소 세트 분리 job 구성
  4. flaky 지표(재시도/실패율) 운영 기준 수립
- 완료 기준
  - 주요 사용자 도메인이 E2E로 비동기 회귀 방어됨
