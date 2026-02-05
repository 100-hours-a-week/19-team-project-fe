# BFF 집계 후보 분석 보고서 (AST 기반)

## 1. 목적
프론트엔드 화면에서 다수의 API 호출이 발생하는 지점을 식별하고,
BFF에서 데이터 집계(aggregation)로 개선 가능한 후보를 도출한다.

## 2. 분석 방법
### 2.1 정적 분석(코드 기반)
- 화면 단위 확인: `src/app/**/page.tsx`
- 각 화면이 사용하는 위젯 추적
- 위젯 내부 API 호출(`getUserMe`, `getChatList` 등) 확인
- 복수 API 호출이 존재하는 화면을 집계 후보로 분류

### 2.2 AST 기반 분석
- TypeScript AST를 사용해 import/export 관계를 따라가며
  “페이지 → 위젯 → API 호출” 매핑을 자동 생성
- 결과는 테이블(CSV/Markdown)과 Mermaid 그래프 형태로 출력

출력 파일:
- `docs/bff/bff-aggregation-analysis.md`
- `docs/bff/bff-aggregation-analysis.csv`
- `docs/bff/bff-aggregation-graph.mmd`

## 3. AST 분석 결과 요약 (자동 추출)
아래 표는 AST 분석 결과를 그대로 요약한 것이다.

| Page | Widgets | API Calls | Count |
|---|---|---:|---:|
| / | Footer, Header, SearchBar, SplashGate, HomeGuardToast, RecruitmentLinksTicker, SignupConfetti, TechBlogBanner, TechBlogTicker | - | 0 |
| /chat | ChatList, Footer | getChatList, getUserMe | 2 |
| /chat/[chatId] | - | - | 0 |
| /chat/[chatId]/detail | - | - | 0 |
| /experts | ExpertSearchPage | getExperts | 1 |
| /experts/[id] | ExpertDetailPage | createChat, getChatList, getExpertDetail, getMe, getResumes | 5 |
| /me | MyPage | getUserMe | 1 |
| /me/edit | MyPageEdit | checkNickname, createPresignedUrl, getCareerLevels, getJobs, getSkills, getUserMe, updateUserMe, uploadToPresignedUrl | 8 |
| /me/verify | MyPageVerify | sendEmailVerification, verifyEmailVerification | 2 |
| /oauth/kakao/callback | KakaoCallbackClient | kakaoLogin | 1 |
| /onboarding | OnboardingRoleSelect | - | 0 |
| /onboarding/profile | OnboardingProfileForm | checkNickname, getCareerLevels, getJobs, getSkills, sendEmailVerification, signup, verifyEmailVerification | 7 |
| /report | Footer, Header | - | 0 |
| /resume | ResumePage | deleteResume, getResumes | 2 |
| /resume/[resumeId] | ResumeDetailPage | getResumeDetail | 1 |
| /resume/edit | ResumeEditPage | createPresignedUrl, createResume, getResumeDetail, parseResumeSync, updateResume, uploadToPresignedUrl | 6 |

## 4. 집계 후보 화면 (우선순위)
집계 대상은 “초기 로딩 시 다수 API 호출”이 있는 화면을 중심으로 선정했다.

### 4.1 /me/edit (우선순위: 매우 높음)
- 주요 호출: `getUserMe`, `getJobs`, `getCareerLevels`, `getSkills`
- 초기 로딩에 필요한 데이터가 4건 이상으로 분산됨
- 집계 제안: `GET /bff/me/edit-bootstrap` → `{ user, jobs, career_levels, skills }`

### 4.2 /onboarding/profile (우선순위: 높음)
- 주요 호출: `getSkills`, `getJobs`, `getCareerLevels`
- 초기 메타데이터 호출 3건
- 집계 제안: `GET /bff/onboarding/metadata` → `{ skills, jobs, career_levels }`

### 4.3 /experts/[id] (우선순위: 중간)
- 주요 호출: `getExpertDetail`, `getResumes`, `getMe`, `createChat`, `getChatList`
- 주요 초기 데이터는 `getExpertDetail` + 로그인 시 `getResumes`
- 집계 제안: `GET /bff/experts/:id/detail` → `{ expert, resumes }`

### 4.4 /chat (우선순위: 중간)
- 주요 호출: `getUserMe`, `getChatList`
- 집계 제안: `GET /bff/chat/list` → `{ currentUser, chats }`

### 4.5 /resume/edit (우선순위: 중간)
- 주요 호출: `getResumeDetail`, `parseResumeSync`, `createResume`, `updateResume`
- 편집 플로우 특성상 액션 호출이 많음
- 집계보다는 요청 수 정리 및 순서 개선이 현실적

## 5. 결론
- 현재 구조는 BFF가 1:1 프록시 역할만 수행하며,
  데이터 집계는 프론트에서 직접 조합하는 방식이다.
- AST 분석 결과 기준, `/me/edit` 및 `/onboarding/profile`이
  BFF 집계 우선 적용 후보로 가장 적합하다.

## 6. 부록: 분석 스크립트 및 실행
스크립트:
- `scripts/ast-api-graph.cjs`

실행:
```
node scripts/ast-api-graph.cjs
```

출력:
- `docs/bff/bff-aggregation-analysis.md`
- `docs/bff/bff-aggregation-analysis.csv`
- `docs/bff/bff-aggregation-graph.mmd`
