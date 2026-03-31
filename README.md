# 🍀 RE-FIT

> **현직자 피드백 기반 커리어 개선 플랫폼**

---

## 🚀 Overview

RE:FIT은 구직자와 이직 준비자가
**실무 기반 피드백을 빠르게 얻고, 지원 전략을 개선할 수 있도록 돕는 플랫폼**입니다.
현직자와 채팅을 하고 대화를 기반하여 AI가 리포트를 제공해줍니다.

<mark> 프론트엔드 관점에서
**실시간 인터랙션, 상태 관리, 스트리밍 처리, UX 개선**에 집중하여 개발했습니다.</mark>

### Dynamic Animation Preview

| 스플래시 | 채팅 요청 | 회원가입 | 확인 요청 |
|:--:|:--:|:--:|:--:|
| <img src="https://github.com/user-attachments/assets/7d7bd9d0-95b0-41c3-b57a-f437a56847ec" width="180"/> | <img src="https://github.com/user-attachments/assets/4078d460-e193-4ea3-a23d-15455ad1f925" width="180"/> | <img src="https://github.com/user-attachments/assets/73fd5391-8163-41b1-a038-8ae794467f1f" width="180"/> | <img src="https://github.com/user-attachments/assets/9ddb7763-be47-4504-abe3-a8758f0cffcf" width="180"/> |


---
## 🖥 UI Preview

| 홈 | 스플래시 | 알림 | 리포트 |
|:--:|:--:|:--:|:--:|
| <img src="https://github.com/user-attachments/assets/cc271392-4ea0-4e15-8776-b530a831894e" width="180"/> | <img src="https://github.com/user-attachments/assets/9ad60cc3-0617-48b4-a7e1-3f481ded74e7" width="180"/> | <img src="https://github.com/user-attachments/assets/7e497269-2882-4b45-adc6-3639e7a297a4" width="180"/> | <img src="https://github.com/user-attachments/assets/29132141-6c22-43fb-8440-ac9173ff403c" width="180"/> |

| 채팅 요청 | 검색 | 마이페이지 | 에이전트 |
|:--:|:--:|:--:|:--:|
| <img src="https://github.com/user-attachments/assets/4ae3196f-b911-49f4-85ee-5286ee31fb1e" width="180"/> | <img src="https://github.com/user-attachments/assets/cfa5c360-ea53-4265-aacf-94b6c031ee70" width="180"/> | <img src="https://github.com/user-attachments/assets/55e99c82-46d2-42ae-95b6-42fcfb242eea" width="180"/> | <img src="https://github.com/user-attachments/assets/648b4c01-9a84-455f-8ca5-f595996869ce" width="180"/> |

---
## 🛠 Frontend Tech Stack

| Category            | Tech                         | Description                          |
|--------------------|------------------------------|--------------------------------------|
| **Core**           | Next.js 16 (App Router)      | React 기반 풀스택 프레임워크         |
|                    | React 19                     | UI 라이브러리                        |
|                    | TypeScript (Strict Mode)     | 정적 타입 안정성 확보                |
| **State & Data**   | Zustand                      | 클라이언트 상태 관리                 |
|                    | TanStack Query               | 서버 상태 관리 및 캐싱               |
| **UI / Styling**   | Tailwind CSS v4              | 유틸리티 기반 스타일링               |
|                    | Storybook                    | 컴포넌트 문서화 및 UI 테스트         |
|                    | Lottie                       | 애니메이션 처리                      |
|                    | Three.js                     | 3D 인터랙션 구현                     |
| **Communication**  | WebSocket (STOMP)            | 실시간 양방향 통신 (채팅)            |
|                    | SSE (Server-Sent Events)     | 서버 → 클라이언트 스트리밍 처리      |
| **UX / Platform**  | Firebase (FCM)               | 푸시 알림                            |
|                    | Service Worker (PWA)         | 오프라인 지원 및 앱 경험 제공        |
| **Testing & DX**   | Playwright                   | E2E 테스트                           |
|                    | pnpm                         | 빠른 패키지 매니저                   |
|                    | React-Toastify               | 사용자 알림 UI                       |
---
## 🎯 Problem & Solution

### ❗ Problem

* 현직자 피드백을 얻기 어려움
* 이력서 개선 방향이 명확하지 않음
* 실시간 커뮤니케이션 경험 부족

### 💡 Solution

* 현직자 검색 및 연결 기능 제공
* 실시간 채팅 기반 피드백 시스템 구축
* 이력서 관리 및 피드백 결과 시각화

---

## ✨ Key Features

### 🔍 현직자 탐색

* 직무 / 회사 기반 필터링
* 추천 시스템 및 상세 프로필 조회

### 💬 실시간 커뮤니케이션

* WebSocket(STOMP) 기반 채팅
* SSE 기반 스트리밍 응답 처리
* 피드백 요청 및 세션 관리

### 📄 이력서 관리

* 생성 / 수정 / 삭제 기능
* PDF 업로드 기반 데이터 등록

### 📊 피드백 리포트

* 피드백 종료 후 결과 요약 제공
* 사용자 개선 포인트 시각화


---


## 🚧 Troubleshooting

- [캐싱 ROI로 TanStack Query와 BFF를 결정한 과정](https://github.com/100-hours-a-week/19-team-project-fe/wiki/%EC%BA%90%EC%8B%B1-ROI%EB%A1%9C-TanStack-Query%EC%99%80-BFF%EB%A5%BC-%EA%B2%B0%EC%A0%95%ED%95%9C-%EA%B3%BC%EC%A0%95)
- [홈 초기 로딩 경로 재설계를 통한 번들 경량화 회고](https://github.com/100-hours-a-week/19-team-project-fe/wiki/%ED%99%88-%EC%B4%88%EA%B8%B0-%EB%A1%9C%EB%94%A9-%EA%B2%BD%EB%A1%9C-%EC%9E%AC%EC%84%A4%EA%B3%84%EB%A5%BC-%ED%86%B5%ED%95%9C-%EB%B2%88%EB%93%A4-%EA%B2%BD%EB%9F%89%ED%99%94-%ED%9A%8C%EA%B3%A0)
- [프로필 이미지 최적화 개선 (Next Image 업로드 전처리)](https://github.com/100-hours-a-week/19-team-project-fe/wiki/%ED%94%84%EB%A1%9C%ED%95%84-%EC%9D%B4%EB%AF%B8%EC%A7%80-%EC%B5%9C%EC%A0%81%ED%99%94-%EA%B0%9C%EC%84%A0-(Next-Image---%EC%97%85%EB%A1%9C%EB%93%9C-%EC%A0%84%EC%B2%98%EB%A6%AC))
- [SSR 504 방지를 위한 BFF Timeout & Fallback 구조 도입](https://github.com/100-hours-a-week/19-team-project-fe/wiki/SSR-504-%EB%B0%A9%EC%A7%80%EB%A5%BC-%EC%9C%84%ED%95%9C-BFF-Timeout-&-Fallback-%EA%B5%AC%EC%A1%B0-%EB%8F%84%EC%9E%85)
- [SSR 차단 제거와 폰트 경량화를 통한 LCP 최적화](https://github.com/100-hours-a-week/19-team-project-fe/wiki/SSR-%EC%B0%A8%EB%8B%A8-%EC%A0%9C%EA%B1%B0%EC%99%80-%ED%8F%B0%ED%8A%B8-%EA%B2%BD%EB%9F%89%ED%99%94%EB%A5%BC-%ED%86%B5%ED%95%9C-LCP-%EC%B5%9C%EC%A0%81%ED%99%94)

---
## 🧠 Frontend Focus (핵심 구현 포인트)

### 1. 실시간 데이터 처리 구조

- WebSocket(STOMP)과 SSE를 목적에 따라 분리 사용
  - 채팅 → WebSocket (양방향 통신)
  - 스트리밍 응답 → SSE (단방향 스트림)
- 각 통신 방식의 특성에 맞게 처리하여 성능과 안정성을 동시에 확보

---

### 2. 상태 관리 및 데이터 패칭 전략

- 서버 상태 → TanStack Query
- 클라이언트 상태 → Zustand  
→ 역할을 명확히 분리하여 복잡도를 낮추고 유지보수성 향상

- TanStack Query 캐시 정책을 활용하여
  - 불필요한 네트워크 요청 최소화
  - 화면 전환 시 즉각적인 응답성 제공

- 사용자 세션 기반 API 호출 패턴을 계측하여
  - 호출 빈도 / 중복 요청 / 지연 시간 분석
  - 데이터 기반으로 캐싱 대상 및 우선순위 정의

---

### 3. 성능 최적화 및 렌더링 안정성

- 동적 import를 통한 코드 스플리팅으로 초기 번들 사이즈 감소
- Web Worker를 활용해 메인 스레드의 Long Task를 분리
  → Idle 구간 확보 및 렌더링 안정성 개선

- Lighthouse CI를 도입하여
  - 빌드 단계에서 성능 저하를 사전 탐지
  - 성능 회귀 방지 자동화 파이프라인 구축

---

### 4. API 구조 개선 (BFF 활용)

**[문제]**
- 다수의 API를 개별 호출하면서
  - 네트워크 요청 증가
  - 응답 및 에러 처리 복잡도 증가
  - 초기 렌더링 지연 발생

**[해결]**
- API 호출 관계를 AST 기반 정적 분석으로 추적하여 집계 대상 식별
- BFF 집계 API 설계
  - 다중 API 호출 → 단일 엔드포인트로 통합
  - 필드 정규화 및 공통 에러 처리 로직 중앙화

**[성과]**
- 업스트림 API를 병렬 집계하여 프론트 요청 단순화
- API 요청 횟수 약 **66.7% 감소**
- 초기 로딩 성능 및 안정성 개선

---

### 5. 사용자 경험 개선

- PWA 적용으로 앱 수준 사용자 경험 제공
- Firebase FCM 기반 실시간 푸시 알림 구현
- Toast / Animation을 활용한 즉각적인 피드백 제공

---

### 6. 품질 관리 및 개발 환경

- ESLint / Prettier / Husky / Commitlint 기반
  → 일관된 코드 품질 유지

- Playwright 기반 E2E 테스트
  → 실제 사용자 흐름 기준 안정성 검증

---

### 7. SEO 최적화

- 동적 메타데이터 적용
- sitemap / robots 설정
- canonical 정책 적용

→ 검색 엔진 색인 품질 및 노출 최적화

---

### 8. 확장 가능한 프론트엔드 구조

- Next.js App Router 기반 구조 설계
- 컴포넌트 단위 분리 + Storybook 관리
→ 재사용성과 확장성을 고려한 아키텍처 구축

---

## ⏱ Duration & Team

* **개발 기간**: 2025.12.22 ~ 2026.03.23

* **구성** : Frontend:1명 / Backend:1명 / AI:1명 / Cloud:2명
  

---


## 🔧 Getting Started

```bash
pnpm install
pnpm dev
```

👉 [서비스 링크](https://re-fit.kr/)

---

## ✅ Quality Checks

```bash
pnpm lint
pnpm type-check
pnpm test:e2e
```

---

