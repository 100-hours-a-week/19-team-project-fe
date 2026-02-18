# Docker Compose 설정 변경 후 컨테이너 미재생성으로 이전 설정이 유지되는 문제

## 증상

- 백엔드 설정 파일에 `redirect-uri-cloudfront` 값을 추가하고 배포
- 배포 스크립트(`docker compose up -d backend`) 실행 완료
- 그런데 백엔드가 여전히 이전 `redirect-uri` 값을 사용
- OAuth redirect가 새로 추가한 CloudFront URL이 아닌 기존 `dev.re-fit.kr`로 동작

## 원인

### 1. Spring Boot는 설정을 기동 시점에 한 번만 읽는다

Spring Boot 애플리케이션은 시작할 때 `application.yml` 등 설정 파일을 메모리에 로드한다. 설정 파일이 변경되더라도 **컨테이너가 재시작되지 않으면 이전 값이 메모리에 남아있다.**

### 2. Docker Compose가 컨테이너를 재생성하지 않는 경우

`docker compose up -d backend` 실행 시, Docker Compose는 다음 조건이 **모두 동일**하면 컨테이너를 재생성하지 않는다:

- 이미지 태그가 동일
- 환경변수가 동일
- 볼륨 마운트가 동일
- 포트 매핑이 동일

설정 파일이 이미지 내부에 포함되어 있고 이미지 태그가 바뀌지 않았다면, Docker Compose는 "변경 없음"으로 판단하여 기존 컨테이너를 그대로 유지한다.

## 진단 방법

```bash
# 컨테이너가 언제 시작되었는지 확인
docker inspect refit-backend --format '{{.State.StartedAt}}'
```

배포 시각보다 `StartedAt`이 이전이면 컨테이너가 재시작되지 않은 것이다.

## 해결 방법

```bash
# 방법 1: 컨테이너 재시작 (기존 컨테이너 유지, 프로세스만 재시작)
docker compose restart backend

# 방법 2: 컨테이너 강제 재생성 (권장 - 확실한 방법)
docker compose up -d --force-recreate backend
```

## 재발 방지

배포 스크립트에서 설정 변경이 포함된 배포 시 `--force-recreate` 플래그를 사용하거나, 이미지 태그를 변경하여 Docker Compose가 변경을 감지할 수 있도록 한다.

```bash
# 배포 스크립트 예시
docker compose pull backend
docker compose up -d --force-recreate backend
```
