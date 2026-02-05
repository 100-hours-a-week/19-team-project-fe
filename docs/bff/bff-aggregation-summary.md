# BFF 집계 요약 보고서

## 1. 핵심 결과
- 화면별 API 호출 수를 AST로 정량화했다.
- 다수 API 호출 화면이 명확하게 식별되며, BFF 집계 우선순위를 설정할 수 있다.

## 2. 우선순위(Top)
### 2.1 /me/edit (최우선)
- 현재 호출: `getUserMe`, `getJobs`, `getCareerLevels`, `getSkills`
- 문제: 초기 로딩에 4개 이상 호출
- 제안: `GET /bff/me/edit-bootstrap`

### 2.2 /onboarding/profile
- 현재 호출: `getSkills`, `getJobs`, `getCareerLevels`
- 문제: 메타데이터 분산 호출
- 제안: `GET /bff/onboarding/metadata`

### 2.3 /chat
- 현재 호출: `getUserMe`, `getChatList`
- 문제: 유저/채팅 리스트 분리
- 제안: `GET /bff/chat/list`

## 3. 기대 효과
- 초기 로딩 요청 수 감소
- 에러 처리/로딩 상태 단순화
- 응답 스키마 일관성 개선

## 4. 참고 파일
- `docs/bff/aggregation-candidates.md`
- `docs/bff/bff-aggregation-analysis.md`
- `docs/bff/bff-aggregation-graph.mmd`
