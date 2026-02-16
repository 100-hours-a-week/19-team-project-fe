# Chat Feedback iOS Layout Fix

## 이슈
- 피드백 설문에서 `STEP 2`의 `충족/부분 충족/미충족` 칩을 누를 때 화면이 튀거나 하단에 비정상 영역(흰 영역)이 보이는 현상 발생.
- 동일 패턴이 `STEP 6/7` 칩 라디오에서도 재현 가능.

## 원인 가설
- iOS Safari에서 `label + input[type=radio].sr-only` 조합 사용 시, 포커스 이동/스크롤 보정이 개입하면서 레이아웃이 튀는 케이스.
- 특히 칩 UI처럼 시각적으로 숨긴 라디오를 사용할 때(`sr-only`) 재현 빈도가 높음.

## 적용한 수정
- 파일: `src/widgets/chat/ui/ChatFeedbackForm.tsx`
- 변경:
  - `STEP 2` 칩 라디오 input class
    - `className="sr-only"` -> `className="hidden"`
  - `STEP 6/7` 칩 라디오 input class
    - `className="sr-only"` -> `className="hidden"`

## 기대 효과
- 칩 선택 시 포커스 기반 레이아웃 점프 감소.
- `핵심 요구사항 2/3` 선택 시 하단 비정상 영역 노출 현상 완화.

## 검증
- `pnpm eslint src/widgets/chat/ui/ChatFeedbackForm.tsx` 통과.

## 추가 대응(재현 시)
- `label` 기반 토글 대신 `button` 기반 토글 컴포넌트로 전환.
- 라디오 입력은 상태 동기화용으로만 최소화하거나 완전히 분리.
