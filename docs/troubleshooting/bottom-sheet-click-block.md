# BottomSheet 클릭 차단 이슈

## 증상
- 온보딩 화면에서 “가입 완료” 버튼이 활성화되어 보이지만 클릭해도 아무 반응이 없음.
- `handleSubmit`에 로그/알럿을 추가해도 호출되지 않음.
- API 요청도 발생하지 않음.

## 원인
- `BottomSheet` 루트 컨테이너가 전체 화면 영역을 `position: fixed`로 덮고,
  `pointer-events: auto`로 클릭 이벤트를 가로챘음.
- 바텀시트가 열려 있는 동안(또는 투명해져도) 중앙 600px 영역의 클릭이
  모두 루트 컨테이너에서 소비되어 뒤쪽 버튼으로 이벤트가 전달되지 않음.

문제 코드 (수정 전)
```tsx
<div
  className={`fixed inset-y-0 left-1/2 z-40 w-full max-w-[600px] -translate-x-1/2 ${
    open ? 'pointer-events-auto' : 'pointer-events-none'
  }`}
>
```

## 해결
- 루트 컨테이너는 `pointer-events: none`으로 두고,
  실제로 클릭되어야 하는 요소(백드롭/시트)에만 `pointer-events: auto` 부여.

수정 코드 (핵심)
```tsx
<div className="fixed inset-y-0 left-1/2 z-40 w-full max-w-[600px] -translate-x-1/2 pointer-events-none">
  <div
    className={`absolute inset-0 bg-black/40 transition-opacity ${
      open ? 'opacity-100 pointer-events-auto' : 'pointer-events-none opacity-0'
    }`}
    onClick={handleClose}
  />
  <div
    className={`absolute inset-x-0 bottom-0 z-50 ... ${effectiveDragging ? 'transition-none' : ''} pointer-events-auto`}
  >
```

## 수정 파일
- `src/shared/ui/bottom-sheet/BottomSheet.tsx`

## 배운 점
- `pointer-events`가 설정된 고정 레이어는 투명해도 이벤트를 가로챌 수 있음.
- 오버레이/모달 구성 시 클릭 이벤트 전달 범위를 명확하게 분리해야 함.
