# ESLint 트러블슈팅

## react-hooks/immutability 에러

### 증상

- `Modifying a value returned from 'useState()'` 또는
  `Modifying a value returned from a hook is not allowed` 에러 발생
- 커밋 훅에서 `pnpm lint`가 실패하면서 커밋이 막힘

### 발생 위치

- `src/widgets/splash-screen/ui/Lanyard.tsx`
  - `curve.curveType = 'chordal'`
  - `texture.wrapS = texture.wrapT = THREE.RepeatWrapping`

### 원인

- 훅(`useState`, `useTexture`)에서 받은 값을 직접 수정(mutate)함
- `react-hooks/immutability` 룰은 훅 반환값의 직접 변경을 금지함
  - 재사용되는 객체가 예상치 못한 사이드 이펙트를 일으킬 수 있기 때문

### 해결

1. 생성 시점에 설정을 적용

- `curve`는 `useMemo`로 생성하면서 `curveType`을 지정

2. 새로운 객체를 만들어 교체

- `texture`는 `texture.clone()` 후 `wrapS/wrapT`를 설정하고 사용

### 적용한 수정 요약

- `useState`로 만들던 `curve`를 `useMemo`로 생성
- `texture`를 클론한 `lanyardTexture`를 만들어 머티리얼에 주입

### 참고 패턴

```tsx
const lanyardTexture = useMemo(() => {
  const cloned = texture.clone();
  cloned.wrapS = THREE.RepeatWrapping;
  cloned.wrapT = THREE.RepeatWrapping;
  cloned.needsUpdate = true;
  return cloned;
}, [texture]);

const curve = useMemo(() => {
  const nextCurve = new THREE.CatmullRomCurve3([...]);
  nextCurve.curveType = 'chordal';
  return nextCurve;
}, []);
```

## 불필요한 eslint-disable 경고

### 증상

- `Unused eslint-disable directive` 경고 발생

### 발생 위치

- `src/widgets/splash-screen/ui/Lanyard.tsx`
  - `/* eslint-disable react/no-unknown-property */`

### 원인

- 실제로 `react/no-unknown-property` 문제가 없는데 주석이 남아 있음

### 해결

- 해당 `eslint-disable` 주석 제거
