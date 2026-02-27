# E2E 테스트 전략 (Playwright)

## 목적

- 사용자 핵심 여정의 회귀를 빠르게 감지한다.
- 장애 비용이 큰 흐름부터 E2E로 보호하고, 나머지는 통합/단위 테스트로 보완한다.

## 우선순위 기준

- `비즈니스 영향`: 실패 시 전환/사용성/신뢰도에 미치는 영향
- `변경 빈도`: 화면/로직 변경으로 회귀 가능성이 높은지
- `불안정성`: 외부 연동/비동기 처리/권한 분기 등 flaky 위험이 높은지

## 리스크 기반 매트릭스

| 시나리오                                             | 영향도 | 변경 빈도 | 우선순위 | 비고                            |
| ---------------------------------------------------- | ------ | --------- | -------- | ------------------------------- |
| 홈 랜딩 + 주요 진입 요소 노출                        | 높음   | 높음      | P0       | 첫 진입 실패는 즉시 이탈로 연결 |
| 홈 알림 진입 + 비로그인 안내                         | 중간   | 중간      | P1       | 헤더 액션/라우팅 회귀 방지      |
| 전문가 탐색 진입 + 검색 UI 노출                      | 높음   | 중간      | P1       | 핵심 탐색 진입점                |
| 보호 페이지(이력서/리포트/채팅/마이) 비로그인 게이트 | 높음   | 높음      | P0       | 인증 분기 회귀 방지             |
| 로그인 페이지 소셜 진입 노출                         | 높음   | 낮음      | P1       | 온보딩 시작점 보호              |

## 1차 구현 범위 (현재 반영)

- [home-landing.spec.ts](/Users/junseopark/Desktop/19-team-project-fe/tests/e2e/home-landing.spec.ts)
- [home-notification-entry.spec.ts](/Users/junseopark/Desktop/19-team-project-fe/tests/e2e/home-notification-entry.spec.ts)
- [experts-discovery.spec.ts](/Users/junseopark/Desktop/19-team-project-fe/tests/e2e/experts-discovery.spec.ts)
- [guest-guard-pages.spec.ts](/Users/junseopark/Desktop/19-team-project-fe/tests/e2e/guest-guard-pages.spec.ts)
- [login-social-entry.spec.ts](/Users/junseopark/Desktop/19-team-project-fe/tests/e2e/login-social-entry.spec.ts)

## 작성 원칙

- 셀렉터는 `role/label/text`를 우선 사용한다.
- `waitForTimeout` 대신 상태 기반 검증(`toBeVisible`, `toHaveURL`)만 사용한다.
- 시나리오는 독립 실행 가능해야 하며 선행 테스트에 의존하지 않는다.
- 첫 방문 스플래시로 인한 flaky를 피하기 위해 세션 부트스트랩을 사용한다.

## 다음 확장 순서

1. 로그인 사용자 fixture 구축(테스트 계정/쿠키 주입)
2. 핵심 생성 흐름 추가: 이력서 생성, 채팅 요청 생성
3. 검증 확장: 생성 성공 토스트, 목록 반영, 상세 진입
4. CI 분리: PR 스모크(현재 5개) / nightly 회귀(확장 시나리오)

- 소셜 로그인 기반 서비스에서 OAuth UI 자동화에 의존하지 않고, 세션/네트워크 계층 분리 전략으로 로그인 이후 플로우를 안정적으로 검증했다.
- 구직자/현직자 `2-Actor` E2E를 설계해 `요청 생성 → 수락 → 채팅 상태 전이 → 리포트 반영 → 이력서 수정 반영`까지 도메인 핵심 여정을 검증했다.
- 단순 렌더링 검증을 넘어서 역할 분기, 인증 게이트, 비동기 결과 생성, 데이터 수정 회귀를 시나리오 단위로 커버했다.
- 목킹 E2E(빠른 회귀)와 소수 실연동 E2E(계약 검증)를 분리하는 테스트 아키텍처를 적용해 속도와 신뢰성을 함께 확보했다.
- flaky 요인을 줄이기 위해 상태 기반 검증 중심으로 작성하고, 첫 방문 스플래시/외부 의존 요소를 테스트 제어 범위 안으로 가져왔다.
