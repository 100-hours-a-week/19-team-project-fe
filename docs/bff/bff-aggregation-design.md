# BFF 집계 API 설계 초안

## 1. /bff/me/edit-bootstrap
### 목적
프로필 편집 화면 초기 로딩 데이터 통합 제공

### 요청
- `GET /bff/me/edit-bootstrap`

### 응답 예시
```json
{
  "user": { /* getUserMe 응답 */ },
  "jobs": [ /* getJobs */ ],
  "career_levels": [ /* getCareerLevels */ ],
  "skills": [ /* getSkills */ ]
}
```

## 2. /bff/onboarding/metadata
### 목적
온보딩 프로필 메타데이터 단일 호출

### 요청
- `GET /bff/onboarding/metadata`

### 응답 예시
```json
{
  "skills": [ /* getSkills */ ],
  "jobs": [ /* getJobs */ ],
  "career_levels": [ /* getCareerLevels */ ]
}
```

## 3. /bff/chat/list
### 목적
채팅 리스트와 현재 유저 정보를 한 번에 제공

### 요청
- `GET /bff/chat/list`

### 응답 예시
```json
{
  "currentUser": { /* getUserMe */ },
  "chats": [ /* getChatList */ ]
}
```

## 4. /bff/experts/:id/detail
### 목적
전문가 상세 + 로그인 사용자 이력서 목록 병합

### 요청
- `GET /bff/experts/:id/detail`

### 응답 예시
```json
{
  "expert": { /* getExpertDetail */ },
  "resumes": [ /* getResumes */ ]
}
```

## 5. /bff/chat/:id/room
### 목적
채팅방 상세 + 히스토리 통합 제공

### 요청
- `GET /bff/chat/:id/room`

### 응답 예시
```json
{
  "detail": { /* getChatDetail */ },
  "messages": [ /* getChatMessages */ ]
}
```

## 참고
실제 스키마는 기존 API 응답 스키마를 그대로 포함하고,
필요 시 BFF에서 정규화한다.
