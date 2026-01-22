# CI/CD 워크플로우 다이어그램

> CI/CD 워크플로우를 Mermaid 다이어그램으로 시각화한 문서입니다.

## 목차

- [현재 시점 (개발환경 미분리)](#현재-시점-개발환경-미분리)
- [미래 시점 (개발환경/운영환경 분리)](#미래-시점-개발환경운영환경-분리)

---

## 현재 시점 (개발환경 미분리)

### 전체 워크플로우

```mermaid
graph TB
    subgraph "Feature Branch Development"
        F[Feature Branch]
    end

    subgraph "Pull Request to Develop"
        PR1[PR: feature → develop<br/>open, synchronize, reopened]
        LT1[lint-and-test Job<br/>• ESLint<br/>• Type Check<br/>• Unit Tests]
    end

    subgraph "Develop Branch"
        D[Develop Branch]
        PUSH1[Push Event<br/>PR Merge or Direct Push]
        INT[integration Job<br/>• Integration Tests<br/>• Security Scan]
        REL1[release Job<br/>• Full Regression<br/>• Build dev env<br/>• Upload Artifacts<br/>• Create Tag]
        CD1[CD Workflow<br/>Deploy to Server]
    end

    subgraph "Pull Request to Main"
        PR2[PR: develop → main<br/>open, synchronize, reopened]
        LT2[lint-and-test Job<br/>• ESLint<br/>• Type Check<br/>• Unit Tests]
    end

    subgraph "Main Branch"
        M[Main Branch]
        PUSH2[Push Event<br/>PR Merge Only]
        REL2[release Job<br/>• Full Regression<br/>• Build prod env<br/>• Upload Artifacts<br/>• Create Tag]
        CD2[CD Workflow<br/>Deploy to Production]
    end

    F -->|Create PR| PR1
    PR1 --> LT1
    LT1 -->|Merge| D
    D --> PUSH1
    PUSH1 -->|Parallel| INT
    PUSH1 -->|Parallel| REL1
    REL1 --> CD1

    D -->|Create PR| PR2
    PR2 --> LT2
    LT2 -->|Merge| M
    M --> PUSH2
    PUSH2 --> REL2
    REL2 --> CD2

    style LT1 fill:#e1f5ff
    style LT2 fill:#e1f5ff
    style INT fill:#fff3e0
    style REL1 fill:#f3e5f5
    style REL2 fill:#f3e5f5
    style CD1 fill:#e8f5e9
    style CD2 fill:#e8f5e9
```

### 브랜치별 상세 흐름

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant F as Feature Branch
    participant D as Develop Branch
    participant M as Main Branch
    participant CI as CI Workflow
    participant CD as CD Workflow
    participant Server as Server

    Note over Dev,F: Feature Development
    Dev->>F: Commit & Push
    Dev->>D: Create PR (feature → develop)

    activate CI
    CI->>CI: lint-and-test<br/>(Lint, Type Check, Unit Test)
    CI-->>Dev: ✅ PR Check Pass
    deactivate CI

    Dev->>D: Merge PR

    Note over D,CI: Develop Push Event
    activate CI
    par Integration & Release
        CI->>CI: integration<br/>(Integration Test, Security Scan)
    and
        CI->>CI: release<br/>(Regression, Build, Artifacts)
    end
    CI->>CD: Trigger CD Workflow
    deactivate CI

    activate CD
    CD->>Server: Deploy to Server (dev env)
    Server-->>CD: ✅ Deployment Success
    deactivate CD

    Note over D,M: Create PR (develop → main)
    Dev->>M: Create PR (develop → main)

    activate CI
    CI->>CI: lint-and-test<br/>(Lint, Type Check, Unit Test)
    CI-->>Dev: ✅ PR Check Pass
    deactivate CI

    Dev->>M: Merge PR

    Note over M,Server: Main Push Event
    activate CI
    CI->>CI: release<br/>(Regression, Build prod, Artifacts)
    CI->>CD: Trigger CD Workflow
    deactivate CI

    activate CD
    CD->>Server: Deploy to Production
    Server-->>CD: ✅ Deployment Success
    deactivate CD
```

---

## 미래 시점 (개발환경/운영환경 분리)

### 전체 워크플로우

```mermaid
graph TB
    subgraph "Feature Branch Development"
        F[Feature Branch]
    end

    subgraph "Pull Request to Develop"
        PR1[PR: feature → develop<br/>open, synchronize, reopened]
        LT1[lint-and-test Job<br/>• ESLint<br/>• Type Check<br/>• Unit Tests]
    end

    subgraph "Develop Branch - Development Environment"
        D[Develop Branch]
        PUSH1[Push Event<br/>PR Merge Only]
        INT[integration Job<br/>• Integration Tests<br/>• Security Scan]
        RELDEV[release-dev Job<br/>• Build dev env<br/>• Upload Artifacts<br/>• Create Tag]
        CDDEV[CD-Dev Workflow<br/>Deploy to Dev Server]
    end

    subgraph "Pull Request to Main"
        PR2[PR: develop → main<br/>open, synchronize, reopened]
        LT2[lint-and-test Job<br/>• ESLint<br/>• Type Check<br/>• Unit Tests]
    end

    subgraph "Main Branch - Production Environment"
        M[Main Branch]
        PUSH2[Push Event<br/>PR Merge Only]
        RELPROD[release-prod Job<br/>• Full Regression<br/>• Build prod env<br/>• Upload Artifacts<br/>• Create Tag]
        CDPROD[CD-Prod Workflow<br/>Deploy to Production]
    end

    F -->|Create PR| PR1
    PR1 --> LT1
    LT1 -->|Merge| D
    D --> PUSH1
    PUSH1 --> INT
    INT -->|Success| RELDEV
    RELDEV --> CDDEV

    D -->|Create PR| PR2
    PR2 --> LT2
    LT2 -->|Merge| M
    M --> PUSH2
    PUSH2 --> RELPROD
    RELPROD --> CDPROD

    style LT1 fill:#e1f5ff
    style LT2 fill:#e1f5ff
    style INT fill:#fff3e0
    style RELDEV fill:#f3e5f5
    style RELPROD fill:#f3e5f5
    style CDDEV fill:#e8f5e9
    style CDPROD fill:#ffebee
```

### 브랜치별 상세 흐름

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant F as Feature Branch
    participant D as Develop Branch
    participant M as Main Branch
    participant CI as CI Workflow
    participant CDDev as CD-Dev Workflow
    participant CDProd as CD-Prod Workflow
    participant DevServer as Dev Server
    participant ProdServer as Prod Server

    Note over Dev,F: Feature Development
    Dev->>F: Commit & Push
    Dev->>D: Create PR (feature → develop)

    activate CI
    CI->>CI: lint-and-test<br/>(Lint, Type Check, Unit Test)
    CI-->>Dev: ✅ PR Check Pass
    deactivate CI

    Dev->>D: Merge PR

    Note over D,CI: Develop Push Event
    activate CI
    CI->>CI: integration<br/>(Integration Test, Security Scan)
    CI->>CI: release-dev<br/>(Build dev env, Artifacts)
    CI->>CDDev: Trigger CD-Dev Workflow
    deactivate CI

    activate CDDev
    CDDev->>DevServer: Deploy to Dev Server
    DevServer-->>CDDev: ✅ Deployment Success
    deactivate CDDev

    Note over D,M: Create PR (develop → main)
    Dev->>M: Create PR (develop → main)

    activate CI
    CI->>CI: lint-and-test<br/>(Lint, Type Check, Unit Test)
    CI-->>Dev: ✅ PR Check Pass
    deactivate CI

    Dev->>M: Merge PR

    Note over M,ProdServer: Main Push Event
    activate CI
    CI->>CI: release-prod<br/>(Full Regression, Build prod, Artifacts)
    CI->>CDProd: Trigger CD-Prod Workflow
    deactivate CI

    activate CDProd
    CDProd->>ProdServer: Deploy to Production
    ProdServer-->>CDProd: ✅ Deployment Success
    deactivate CDProd
```

### Job 의존성 관계

```mermaid
graph LR
    subgraph "현재 (개발환경 미분리)"
        direction TB
        A1[Push to develop] --> B1[integration]
        A1 --> C1[release]
        C1 --> D1[CD]

        A2[Push to main] --> C2[release]
        C2 --> D2[CD]
    end

    subgraph "미래 (개발환경/운영환경 분리)"
        direction TB
        A3[Push to develop] --> B3[integration]
        B3 --> C3[release-dev]
        C3 --> D3[CD-dev]

        A4[Push to main] --> C4[release-prod]
        C4 --> D4[CD-prod]
    end

    style B1 fill:#fff3e0
    style C1 fill:#f3e5f5
    style D1 fill:#e8f5e9
    style C2 fill:#f3e5f5
    style D2 fill:#e8f5e9
    style B3 fill:#fff3e0
    style C3 fill:#f3e5f5
    style D3 fill:#e8f5e9
    style C4 fill:#f3e5f5
    style D4 fill:#ffebee
```

---

## Job별 실행 매트릭스

### 현재 시점

| 이벤트 | 브랜치 | lint-and-test | integration | release | CD |
|--------|--------|---------------|-------------|---------|-----|
| **PR 생성** | feature → develop | ✅ | ❌ | ❌ | ❌ |
| **Push** | develop | ❌ | ✅ | ✅ | ✅ |
| **PR 생성** | develop → main | ✅ | ❌ | ❌ | ❌ |
| **Push** | main | ❌ | ❌ | ✅ | ✅ |

### 미래 시점

| 이벤트 | 브랜치 | lint-and-test | integration | release-dev | release-prod | CD-dev | CD-prod |
|--------|--------|---------------|-------------|-------------|--------------|---------|----------|
| **PR 생성** | feature → develop | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Push** | develop | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **PR 생성** | develop → main | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Push** | main | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |

---

## 주요 차이점

### Job 구조 비교

```mermaid
graph LR
    subgraph "현재"
        direction LR
        R1[release Job]
        R1 -->|환경변수로 분기| E1{Environment}
        E1 -->|develop| DEV1[development]
        E1 -->|main| PROD1[production]
    end

    subgraph "미래"
        direction LR
        R2[release-dev Job]
        R3[release-prod Job]
        R2 --> DEV2[development]
        R3 --> PROD2[production]
    end

    style R1 fill:#f3e5f5
    style R2 fill:#e1f5ff
    style R3 fill:#ffebee
```

### CD Workflow 비교

```mermaid
graph TB
    subgraph "현재"
        direction TB
        CI1[CI release Job] -->|Trigger| CD1[cd.yml]
        CD1 -->|Branch 기반 분기| ENV1{Environment}
        ENV1 -->|develop| S1[Server Dev]
        ENV1 -->|main| S2[Server Prod]
    end

    subgraph "미래 (권장)"
        direction TB
        CI2[CI release-dev Job] -->|Trigger| CD2[cd-dev.yml]
        CI3[CI release-prod Job] -->|Trigger| CD3[cd-prod.yml]
        CD2 --> S3[Dev Server]
        CD3 --> S4[Prod Server]
    end

    style CD2 fill:#e8f5e9
    style CD3 fill:#ffebee
```

---

## 관련 문서

- [CI/CD 워크플로우 개요](./cicd-workflow-overview.md)
- [CI/CD 상세 프로세스](./cicd-process.md)
- [배포 가이드](./bigbang-deployment.md)
- [CI 워크플로우](../../.github/workflows/ci.yml)
- [CD 워크플로우](../../.github/workflows/cd.yml)
