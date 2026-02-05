# AST 분석 근거 및 한계

## 1. 근거(왜 신뢰 가능한가)
- TypeScript AST로 import/export 관계를 추적하여
  “페이지 → 위젯 → API 호출” 구조를 자동으로 매핑했다.
- 사람이 수동으로 놓칠 수 있는 호출 누락 가능성을 줄인다.
- 결과는 테이블(CSV/Markdown)과 Mermaid 그래프로 출력되어
  재현 가능하다.

## 2. 한계(무엇이 빠질 수 있는가)
- 동적 import/조건부 호출은 정적 분석에 포착되지 않을 수 있다.
- 런타임 상태(로그인 여부, feature flag 등)에 따른 호출 차이는
  AST만으로 구분하기 어렵다.
- 실제 네트워크 호출 수와 1:1로 일치하지 않을 수 있다.

## 3. 보완 방법
- 주요 화면 1~2개는 DevTools Network 캡처로 실측 증빙
- 분석 결과와 실제 호출 수를 비교하여 차이를 설명

## 4. 참고 파일
- `docs/bff/bff-aggregation-analysis.md`
- `docs/bff/bff-aggregation-analysis.csv`
- `docs/bff/bff-aggregation-graph.mmd`
