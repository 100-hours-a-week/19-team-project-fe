# 오프라인 서비스워커 전략표 + 실행 계획서

작성일: 2026-02-24  
대상: Next.js 16 App Router (`/src/app`) + BFF 라우트(`src/app/bff/*`)

## 1) 목표/범위

- 목표: 네트워크가 불안정하거나 오프라인일 때도 핵심 화면 진입과 기본 조회 경험을 유지한다.
- 범위: 읽기 중심 화면 우선(홈, 전문가 목록/상세).
- 개인화 화면(리포트/이력서/마이/알림)은 SW 캐시 없이 네트워크 우선 + TanStack Query 캐시로 처리.
- 비범위: 실시간 채팅 송수신, 인증 갱신, 파일 업로드, 결제/민감 트랜잭션의 완전 오프라인 처리.

## 2) 캐시 전략 표 (확정안)

| 대상 | 경로/패턴 | 전략 | TTL/정책 | 비고 |
|---|---|---|---|---|
| 앱 셸(정적 자산) | `/_next/static/*`, `/*.css`, `/*.js`, `icons/*`, `manifest.webmanifest` | `CacheFirst` | 빌드 해시 변경 시 자동 갱신 | 오프라인 첫 진입 품질 핵심 |
| 문서 네비게이션 | 페이지 라우트(`GET`, HTML) | `NetworkFirst` + offline fallback | 타임아웃 2~3초 후 fallback | 최신성 우선, 실패 시 오프라인 페이지 |
| 홈 추천(읽기) | `/bff/experts/recommendations` | `StaleWhileRevalidate` | 10분 | 이전 데이터 즉시 노출 |
| 전문가 목록/상세 | `/bff/experts*` | `StaleWhileRevalidate` | 10분 | 목록/상세 모두 읽기 캐시 |
| 리포트 목록/상세(개인화) | `/bff/reports*` | `NetworkOnly` | 캐시 금지 | 사용자별 응답 혼합 리스크 차단 |
| 이력서 목록/상세(개인화) | `/bff/resumes*` | `NetworkOnly` | 캐시 금지 | 사용자별 응답 혼합 리스크 차단 |
| 마이페이지 조회(개인화) | `/bff/users/me*` | `NetworkOnly` | 캐시 금지 | 개인정보 최신성/보안 우선 |
| 알림 조회(개인화) | `/bff/notifications*` | `NetworkOnly` | 캐시 금지 | 읽음 상태/개인 데이터 보호 |
| 인증 관련 | `/bff/auth/*`, `/bff/email-verifications/*` | `NetworkOnly` | 캐시 금지 | 토큰/세션 일관성 |
| 업로드 관련 | `/bff/uploads/presigned-url`, `/bff/resumes/tasks` | `NetworkOnly` | 캐시 금지 | 서명 URL/작업 상태 최신성 필수 |
| 채팅 실시간/메시지 | `/bff/chat/*` + WS | `NetworkOnly` | 캐시 금지 | 오프라인 대체 UX 별도(쓰기/읽기 모두 비캐시) |
| GA/서드파티 스크립트 | `googletagmanager` 등 | 기본 네트워크 | 실패 허용 | 서비스 핵심 경로에서 분리 |

정책 메모:
- Service Worker는 URL 기준 캐시가 기본이므로 사용자 컨텍스트 없는 개인화 API 캐시는 금지한다.
- 개인화 데이터의 오프라인 보조는 SW가 아니라 TanStack Query 캐시(앱 레이어)에서만 처리한다.

## 3) 오프라인 UX 정책

- 오프라인 페이지: `offline.html` 또는 `/offline` 라우트 제공.
- 읽기 화면: 마지막 성공 데이터 + "오프라인 데이터" 배지 표시.
- 쓰기 화면:
  - 채팅 전송/이력서 저장/알림 읽음은 기본 차단하고 재시도 버튼 제공.
  - 추후 2차로 Background Sync 큐잉 검토.
- 오류 문구 표준화:
  - "현재 오프라인 상태입니다."
  - "마지막 동기화: YYYY-MM-DD HH:mm"

## 4) 구현 계획 (2주, 4단계)

## 단계 1. 기반 구성 (2026-02-25 ~ 2026-02-26)

- `next-pwa` 또는 Workbox 도입(운영 빌드에서만 활성화).
- 서비스워커 등록 가드:
  - 개발환경(`next dev`) 비활성.
  - 브라우저 지원/HTTPS 체크.
- 오프라인 fallback 문서 추가.

완료 기준:
- 서비스워커 등록/업데이트/해제 로그 확인 가능.
- 오프라인 시 정적 셸 로드 성공.

## 단계 2. 공개 읽기 API 캐시 (2026-02-27 ~ 2026-03-02)

- 공개 읽기 API에만 `StaleWhileRevalidate`/`NetworkFirst` 적용.
- 개인화 API(`/bff/users/me*`, `/bff/reports*`, `/bff/resumes*`, `/bff/notifications*`)는 `NetworkOnly`로 고정.
- 민감 응답(`auth`, `token`, `presigned-url`) 캐시 제외 규칙 유지.

완료 기준:
- 네트워크 차단 상태에서 홈/전문가(공개 데이터) 진입 가능.
- 개인화 API는 SW 캐시를 생성하지 않음.

## 단계 3. UX/무효화/관측성 (2026-03-03 ~ 2026-03-05)

- 화면별 오프라인 배지/재시도 UI 추가.
- 변경 API 성공 시 관련 캐시 무효화(예: 리포트 삭제 후 목록 캐시 정리).
- 메트릭 수집:
  - SW install/activate 비율
  - 오프라인 fallback hit 수
  - API 캐시 hit ratio

완료 기준:
- 사용자 동작 관점에서 "오프라인 상황 인지 + 복구 경로" 확보.

## 단계 4. 안정화/릴리즈 (2026-03-06 ~ 2026-03-07)

- 회귀 테스트(브라우저 devtools offline/throttling).
- Lighthouse PWA/Performance 재측정.
- 캐시 버전 정책 확정(`cache-v1` -> 배포 단위 증가).

완료 기준:
- 배포 체크리스트 통과.
- 롤백 절차 문서화 완료.

## 5) 리스크와 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| 사용자별 응답 캐시 혼합 | 개인정보 노출/오동작 | 개인화 API SW 캐시 전면 금지(`NetworkOnly`) |
| 오래된 데이터 노출 | 신뢰도 저하 | TTL 단축 + 화면에 "마지막 동기화 시각" 노출 |
| SW 업데이트 지연 | 버그 지속 | `skipWaiting/clientsClaim` 정책 검토 + 강제 새로고침 배너 |
| 캐시 과다 사용 | 저장소 압박 | 캐시 엔트리 수 상한(`maxEntries`) + 만료(`maxAgeSeconds`) |

## 6) 테스트 체크리스트

- 네트워크 Offline에서 `/` 진입 가능.
- 이미 방문한 `/experts` 재진입 가능.
- `/bff/users/me*`, `/bff/reports*`, `/bff/resumes*`, `/bff/auth/*` 요청은 SW 캐시되지 않음.
- 로그인 사용자 A/B 전환 시 SW 레벨 캐시 충돌 없음.
- SW 신규 배포 후 1회 재방문 시 최신 자산 반영.

## 7) 권장 기술 선택

- 1순위: `next-pwa` + Workbox 런타임 캐시 설정
- 이유:
  - Next App Router에 비교적 빠르게 적용 가능
  - 정적/런타임 캐시 정책 분리 용이
  - 점진적 도입(읽기 API부터) 가능

## 8) 승인 요청 사항

- 오프라인 보장 범위 확정:
  - 필수: 홈, 전문가 조회(공개 데이터 중심)
  - 제외: 리포트/이력서/마이/알림(개인화 API SW 캐시 미적용), 채팅 송신, 업로드, 인증/계정변경
- 배포 전략:
  - 스테이징 3일 관찰 후 운영 반영
