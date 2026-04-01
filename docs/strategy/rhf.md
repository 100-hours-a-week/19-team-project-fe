# React Hook Form(RHF) 도입 전략

## 1) RHF 정의

React Hook Form(RHF)은 React 환경에서 폼 상태, 검증, 제출 흐름을 최소 렌더링으로 관리하기 위한 라이브러리다.

핵심 관점은 다음과 같다.

- 폼 상태를 `useState` 다건으로 분산 관리하지 않고, 단일 폼 컨텍스트에서 통합 관리
- 입력값/에러/제출 상태를 선언적으로 관리
- 대규모 폼에서 불필요한 리렌더를 줄여 성능과 유지보수성을 동시에 확보

---

## 2) 핵심 개념

### 2-1. `useForm`

- 폼 인스턴스 생성
- `register`, `control`, `handleSubmit`, `setValue`, `watch`, `formState` 등을 제공

### 2-2. `register`

- 기본 input/select/textarea를 RHF와 연결
- 값 추적 및 검증 규칙 적용

### 2-3. `Controller`

- 커스텀 컴포넌트(직접 value/onChange를 쓰는 UI) 연결 시 사용
- 예: 바텀시트 선택 UI, 커스텀 토글, 멀티 선택 칩

### 2-4. `formState`

- `errors`, `isValid`, `isSubmitting` 등 폼 상태를 단일 출처로 제공

### 2-5. `handleSubmit`

- 제출 전 검증을 수행하고, 성공 시에만 submit 로직 실행

### 2-6. (선택) Resolver + 스키마 검증

- `zodResolver` 등을 이용하면 검증 규칙을 스키마로 분리 가능
- UI/도메인 검증 규칙을 문서화 가능한 형태로 유지할 수 있음

---

## 3) 도입 배경 (온보딩 프로필)

현재 온보딩 프로필(설문조사 확장 전 구현)은 상태와 검증이 분산되어 있다.

- 필드 상태: `useOnboardingFormState`
- 제출 검증: `useOnboardingSubmit`
- 닉네임 중복 확인: `useOnboardingNicknameCheck`
- 이메일 인증: `useOnboardingEmailVerification`

이 구조는 기능 확장 시 다음 비용이 발생한다.

- 필드 추가 시 수정 지점 증가
- 검증 규칙과 UI 에러 표시 흐름이 분리
- 제출 가능 조건(`isSubmitDisabled`)과 실제 submit 검증 로직 중복

---

## 4) 기존 구현 코드 (설문조사 이전 온보딩)

아래는 현재 코드의 핵심 발췌다.

### 4-1. 상태 분산 관리 (`useOnboardingFormState`)

```ts
const [selectedJob, setSelectedJob] = useState<Job | null>(null);
const [selectedCareer, setSelectedCareer] = useState<CareerLevel | null>(null);
const [selectedTech, setSelectedTech] = useState<Skill[]>([]);
const [nickname, setNickname] = useState('');
const [introduction, setIntroduction] = useState('');
const [termsAgreed, setTermsAgreed] = useState(false);
const [privacyAgreed, setPrivacyAgreed] = useState(false);
const [pledgeAgreed, setPledgeAgreed] = useState(false);
```

### 4-2. 제출 시 수동 검증 (`useOnboardingSubmit`)

```ts
if (!selectedJob || !selectedCareer) {
  setSubmitError('직무와 경력을 선택해 주세요.');
  return;
}
if (!isExpert && selectedTech.length === 0) {
  setSubmitError('기술 스택을 선택해 주세요.');
  return;
}

const trimmedNickname = nickname.trim();
if (!trimmedNickname) {
  setSubmitError('닉네임을 입력해 주세요.');
  return;
}
if (trimmedNickname.length > nicknameLimit) {
  setSubmitError('닉네임이 너무 길어요.');
  return;
}
```

### 4-3. 제출 가능 조건 별도 계산 (`useOnboardingProfileForm`)

```ts
const isSubmitDisabled =
  submit.isSubmitting ||
  !form.selectedJob ||
  !form.selectedCareer ||
  (form.selectedTech.length === 0 && !isExpert) ||
  !form.nickname.trim() ||
  !allRequiredAgreed;
```

---

## 5) RHF 도입 방향

### 5-1. 적용 범위

- 온보딩 프로필 폼 (`OnboardingProfileForm`) 우선 적용
- 설문조사(피드백 폼) 전환은 별도 이슈로 분리

### 5-2. 전환 원칙

- 기존 UX/요구사항 유지 (닉네임 체크, 이메일 인증, 약관 동의)
- 폼 필드는 RHF에 수렴
- 제출 payload 생성은 기존 `signup` 계약 유지

### 5-3. 상태 책임 분리

- RHF: 입력값, 에러, 제출 상태, 검증
- 별도 훅 유지: 서버 통신성 보조 로직(닉네임 중복 API, 이메일 인증 API)
- 교차 상태는 `watch`, `setValue`, `setError` 기반으로 동기화

---

## 6) 단계별 실행 계획

1. RHF 의존성 추가 및 온보딩 전용 form type 정의
2. `useOnboardingProfileForm`에 `useForm` 도입, 기본값/검증 규칙 이관
3. 입력 필드(`nickname`, `introduction`)를 `register`로 연결
4. 선택 필드(`job`, `career`, `tech`)를 `Controller` 또는 `setValue` 기반으로 연결
5. 약관 동의 필드(`termsAgreed`, `privacyAgreed`, `pledgeAgreed`)를 RHF 필드로 이관
6. `handleSubmit`를 RHF `handleSubmit`로 교체하고 기존 API payload와 매핑
7. 닉네임 중복 확인/이메일 인증 로직과 RHF 값 변경 동기화
8. 회귀 점검: 구직자/현직자 분기, 필수값 검증, 버튼 활성화 조건, 에러 메시지

---

## 7) 기대 효과

- 폼 상태/검증/제출 흐름 단일화
- 신규 필드 추가 시 변경 지점 축소
- 에러 처리 일관성 확보
- 설문조사 폼 전환 시 재사용 가능한 폼 패턴 확보

