#  폴더 구조 (FSD 기반)

본 프로젝트는 **Feature-Sliced Design(FSD)** 을 기반으로 폴더 구조를 설계한다.
Next.js **App Router** 특성을 반영하여 `app/` 디렉토리는 **라우팅 엔트리 및 조합(Composition) 전용 Entry Layer** 로 제한한다.

기존의 역할 기반 구조(`pages/`, `components/`, `hooks/` 등)는 프로젝트가 성장할수록 다음 문제가 반복된다.

* 기능(도메인) 단위 책임/소유 범위가 흐려짐
* 하나의 기능 로직이 UI/Hook/상태 폴더로 분산되어 응집도 저하
* 변경/삭제/재사용 시 영향 범위 추적이 어려움
* 도메인 규칙이 중복 구현되며 결합도 상승

FSD는 기능(Feature)과 도메인(Entity)을 기준으로 코드를 묶어 **응집도를 높이고 결합도를 낮춘다.** 또한 레이어 간 **단방향 의존성 규칙**을 통해 구조 확장 시에도 의존성 흐름을 예측 가능하게 유지한다.

---

## 3.1 폴더 설계 원칙

### 3.1.1 `app/` 디렉토리 운영 원칙 (Entry Layer)

`app/`은 **라우팅 엔트리 및 화면 조합만 담당**한다.

**`app/`에서 허용되는 것**

* `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` 등 라우팅 엔트리 파일
* route segment 수준의 조합: `widgets/features/entities`를 가져와 화면 구성
* `metadata`, `generateMetadata`, `generateStaticParams` 등 Next 라우팅 관련 코드
* (선택) Route Handler(BFF)가 필요한 경우 `app/api/*/route.ts`

**`app/`에서 금지되는 것**

* 도메인 모델/상태 정의, 비즈니스 규칙(계산/정책/분기)
* query/mutation/store 등 상태 관리 로직 정의
* 공용 UI 컴포넌트 구현(Button/Modal 등)
* 재사용 목적의 util/helper 작성

> 원칙: `page.tsx`는 **얇게(thin)** 유지한다. 로직이 커지는 순간 그 코드는 `widgets/features/entities`로 내려간다.

---

### 3.1.2 App Router에서 `pages` 레이어 치환 규칙

전통적인 FSD의 `pages` 레이어는 App Router에서 `app/**/page.tsx`가 담당한다.
따라서 별도의 `pages/` 디렉토리를 만들지 않는다.

`page.tsx`의 책임은 아래로 제한한다.

* 라우트 파라미터 파싱
* 필요한 위젯 배치(Composition)
* Server/Client Boundary가 드러나는 thin layer 유지

---

### 3.1.3 레이어 구조와 책임 정의

레이어는 “재사용 수준 + 책임 범위” 기준으로 분리한다.

* `widgets/` : **페이지 섹션 단위 복합 UI 블록** (여러 feature/entity 조합)
* `features/` : **사용자 시나리오/행동** (mutation, 액션, 후처리 흐름)
* `entities/` : **도메인 모델/조회(query) 중심** (타입/모델/도메인 UI/서버상태 조회)
* `shared/` : **도메인 무관 공통** (primitive UI, lib, config, infra, utils)

**예시 매핑**

* “전문가 리스트 섹션” → `widgets`
* “채팅 요청하기 버튼 + mutation + 후처리” → `features`
* “expert 도메인 타입/조회 API/queryKey” → `entities`
* “Button/Modal/cn()/queryClient/fetcher” → `shared`

---

### 3.1.4 Clear Boundaries & Public Interface (캡슐화 규칙)

Auth/Chat/Report 같은 도메인에는 정책/권한/상태 전이/캐싱/실시간 처리 등 **변경 가능성이 높은 규칙**이 집중된다.
이 구현이 외부 레이어에 직접 노출되면 아래 문제가 발생한다.

* 동일 규칙이 여러 레이어에서 중복 판단
* 도메인 내부 변경이 전체 구조로 전파
* 도메인 책임 경계가 흐려짐

따라서 각 Slice는 내부 구현을 차단하고, **명시적인 Public Interface(`index.ts`)로만 접근**하도록 강제한다.

**[원칙]**

1. 모든 Slice는 `index.ts`를 Public Interface로 가진다
2. 외부 레이어는 `index.ts`만 import 한다
3. `ui/*`, `model/*`, `api/*`, `lib/*` 내부 파일 경로 직접 접근을 금지한다

**구조 예시**

```
features/
└─ login/
   ├─ ui/
   │  └─ LoginForm.tsx
   ├─ model/
   │  └─ useLogin.ts
   └─ index.ts   # Public Interface
```

**금지**

```ts
import { LoginForm } from "@/features/login/ui/LoginForm";
```

**허용**

```ts
import { LoginForm } from "@/features/login";
```

---

### 3.1.5 의존성 방향(단방향) 규칙

의존성은 아래 방향으로만 흐른다.

`app (entry) → widgets → features → entities → shared`

**세부 규칙**

* 하위 레이어는 상위 레이어를 참조할 수 없다.
* feature 간 상호 의존 금지

  * 필요 시 공통 로직을 `entities/shared`로 이동
* entities 간 의존은 가능하나 “도메인 경계 침범”이면 재검토
* `shared`는 어디서나 사용 가능하지만 상위 레이어에 의존하면 안 된다

---

### 3.1.6 Server/Client 실행 환경 분리 규칙 (파일 단위 강제)

App Router(Server Component/RSC)는 import 가능한 모듈 제약이 크다.
따라서 실행 환경을 **파일명/디렉토리 규칙으로 강제**한다.

**규칙**

* 서버 전용 로직: `.server.ts` 또는 `server/`
* 클라이언트 전용 로직: `.client.ts` 또는 `client/`
* `use client`는 slice의 `ui/` 내부에서만 제한적으로 사용(남발 금지)

**금지**

* Server Component에서 client-only 모듈 import
* 서버/클라이언트 혼합 유틸을 한 파일에 작성

---

### 3.1.7 Slice 내부 표준 구조

각 Slice는 필요한 것만 선택적으로 포함하되, 기본적으로 아래 구조를 지향한다.

* `ui/` : 컴포넌트(프리젠테이션 + 최소 UI 로직)
* `model/` : 상태/스토어/비즈니스 규칙(클라이언트 상태 포함)
* `api/` : fetcher, queryKey/queryFn, DTO 매핑
* `lib/` : slice 내부 전용 유틸
* `types/` : slice 범위 타입(가능하면 model로 흡수)

외부로 노출할 항목만 `index.ts`에서 export 한다.

---

## 3.2 폴더 구조 예시 (간단 설계)

```
src/
├─ app/                              # Next.js Route Entry (조합 전용)
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ (public)/
│  │  ├─ page.tsx
│  │  └─ onboarding/page.tsx
│  ├─ (auth)/
│  │  ├─ chats/
│  │  │  ├─ page.tsx
│  │  │  └─ [id]/page.tsx
│  │  └─ my-page/page.tsx
│  └─ api/                           # (선택) Route Handler/BFF
│     └─ auth/route.ts

├─ widgets/
│  ├─ header/
│  │  ├─ ui/Header.tsx
│  │  └─ index.ts
│  ├─ expert-list/
│  │  ├─ ui/
│  │  │  ├─ ExpertList.tsx
│  │  │  └─ ExpertCard.tsx
│  │  └─ index.ts
│  └─ chat-room/
│     ├─ ui/
│     └─ index.ts

├─ features/
│  ├─ login/
│  │  ├─ ui/
│  │  ├─ model/
│  │  ├─ api/
│  │  └─ index.ts
│  ├─ request-chat/
│  │  ├─ ui/
│  │  ├─ model/
│  │  ├─ api/
│  │  └─ index.ts
│  └─ submit-feedback/
│     ├─ ui/
│     ├─ model/
│     ├─ api/
│     └─ index.ts

├─ entities/
│  ├─ user/
│  │  ├─ model/
│  │  ├─ api/
│  │  ├─ ui/
│  │  └─ index.ts
│  ├─ expert/
│  │  ├─ model/
│  │  ├─ api/
│  │  ├─ ui/
│  │  └─ index.ts
│  └─ chat/
│     ├─ model/
│     ├─ api/
│     ├─ ui/
│     └─ index.ts

├─ shared/
│  ├─ ui/                            # primitive UI
│  │  ├─ button/Button.tsx
│  │  └─ modal/Modal.tsx
│  ├─ lib/
│  │  ├─ react-query/queryClient.ts
│  │  └─ fetch/fetcher.ts
│  ├─ config/
│  │  └─ env.ts
│  ├─ utils/
│  │  └─ cn.ts
│  └─ styles/
│     ├─ globals.css
│     └─ tailwind.css

└─ types/                            # (선택) 전역 타입이 꼭 필요할 때만
```

