# 🌱 FarmBalance — 양평군 스마트 파밍 및 수급 균형 플랫폼

> 양평군 농업인을 위한 작물 수급 균형 관리 및 AI 기반 스마트 파밍 플랫폼

---

## 📋 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **팀** | Team 1 - YangPyeong |
| **기간** | 6주 (5주 MVP + 1주 안정화) |
| **기술 스택** | Spring Boot 3.3 · Next.js 15 · FastAPI · PostgreSQL |

---

## 🚀 시작하기

### 1. 클론

```bash
git clone https://github.com/newlecture-ibm2/team1-YangPyeong.git
cd team1-YangPyeong
```

### 2. 초기 환경 설정 (최초 1회)

> ⚠️ **반드시 실행해주세요!** 에이전트 셋업, 패키지 설치, 환경변수 생성이 자동 진행됩니다.

```bash
bash setup.sh
```

이 스크립트가 완전히 자동으로 수행하는 작업:
- ✅ **AI 에이전트 규칙 연동**: `.agents/rules/` 폴더를 워크스페이스와 연결
- ✅ **환경 변수 템플릿 복사**: 사용 가능한 `.env.example`을 기준으로 기본 `.env` 자동 복사
- ✅ **권한 설정**: Spring Boot `backend/gradlew` 실행 권한 부여
- ✅ **패키지 자동 설치**: Frontend(`npm install`) 및 AI(`python3 -m venv` 및 `pip install`)
- *(이후 팀원 모두가 공통된 환경과 개발 가이드라인을 공유하게 됩니다)*

### 3. 서비스별 실행

```bash
# Backend (Spring Boot)
cd backend && ./gradlew bootRun

# Frontend (Next.js)
cd frontend && npm install && npm run dev

# AI (FastAPI)
cd ai && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload
```

---

## 📁 프로젝트 구조

```
team1-YangPyeong/
├── backend/      ← Spring Boot (헥사고날 아키텍처)
├── frontend/     ← Next.js 15 (BFF + 코로케이션)
├── ai/           ← FastAPI + 멀티 LLM + Agent + RAG
├── docs/         ← 기획/설계 문서
├── scripts/      ← 운영 스크립트 (EC2 배포 등)
├── .agents/      ← AI 에이전트 개발 규칙
├── setup.sh      ← 로컬 초기 환경 설정 스크립트
└── docker-compose.yml
```

> 상세 구조는 [docs/architecture/folder-structure.md](docs/architecture/folder-structure.md) 참조

---

## 📖 주요 문서

| 문서 | 설명 |
|------|------|
| [project-spec.md](docs/project-spec.md) | 통합 기획서 (Single Source of Truth) |
| [folder-structure.md](docs/architecture/folder-structure.md) | 폴더 구조 가이드 v4 |
| [ai-architecture.md](docs/architecture/ai-architecture.md) | AI 서버 아키텍처 상세 |
| [ERD.md](docs/architecture/ERD.md) | 데이터베이스 설계 |
| [api-spec.md](docs/architecture/api-spec.md) | 내부 API 명세서 |

---

## 🔧 개발 규칙

- **커밋**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **브랜치**: `main` (배포) / `dev` (개발)
- **Backend**: 헥사고날 아키텍처 (adapter/in, adapter/out)
- **Frontend**: Next.js 코로케이션 (`_hooks/`, `_lib/`, `_components/`)
- **AI 에이전트 규칙**: `.agents/rules/` 참조

---

## 🚀 개발 시작 가이드 (Onboarding)

우리 프로젝트는 **AI 에이전트(Antigravity)**를 활용하여 설계를 자동화하고 생산성을 극대화합니다. 에이전트가 많은 코드를 작성하지만, 팀원들은 이를 검토하고 로컬에서 최종 테스트하기 위해 아래 도구들을 반드시 설치해 주세요.

### 1. 필수 설치 도구 (작업 책상)
에이전트가 짜준 코드를 확인하고 데이터를 직접 제어하기 위한 최소한의 도구입니다.

- **[IntelliJ IDEA](https://www.jetbrains.com/idea/download/)**: 백엔드(Java/Spring) 코드 리뷰 및 디버깅용
- **[VS Code](https://code.visualstudio.com/)**: 프론트엔드 및 AI 서버 개발/수정용
- **[DBeaver](https://dbeaver.io/download/)**: AI가 생성한 DB 데이터를 시각적으로 확인하고 편집하는 용도 (Community Edition 추천)
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**: 로컬 컨테이너 실행 환경
- **[Postman](https://www.postman.com/downloads/)**: API 작동 여부 테스트

### 2. 프로젝트 핵심 설정 (환경 변수)

프로젝트 구동을 위해 각 모듈의 설정 파일에 아래 내용을 반영해야 합니다. (민감 정보는 별도 공지된 값을 사용하세요)

#### 🍃 Backend (Spring Boot) - `application.yml`
```yaml
spring:
  datasource:
    url: jdbc:postgresql://farmbalance-db.cwt02w6i4a4b.us-east-1.rds.amazonaws.com:5432/farmbalance
    username: postgres
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: update
cloud:
  aws:
    s3:
      bucket: farmbalance-storage-2026
    region:
      static: us-east-1
    credentials:
      instance-profile: true # 서버 배포 시 자동 인식
```

#### 🌐 Frontend (Next.js) - `.env.local`
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 # 로컬 테스트용
# 배포용: http://3.94.108.113:8080
```

#### 🤖 AI Server (FastAPI) - `.env`
```env
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
```

---

### 3. EC2 서버 초기 구축 (배포 담당자용)

> ⚠️ **EC2 서버에 최초 배포할 때만** 실행합니다. 로컬 개발 환경과는 무관합니다.

```bash
# EC2 인스턴스에 SSH 접속 후 실행
bash scripts/ec2-setup.sh
```

이 스크립트가 수행하는 작업:
- ✅ **시스템 업데이트**: `apt-get update && upgrade`
- ✅ **Docker 설치**: `docker.io` 설치 및 서비스 활성화
- ✅ **Docker Compose v2 설치**: 최신 릴리스 자동 감지 및 설치
- ✅ **유저 권한 설정**: `ubuntu` 유저를 docker 그룹에 추가
- ✅ **유틸리티 설치**: git, curl, unzip

> 실행 완료 후 docker 그룹 권한 적용을 위해 **서버에 재접속(exit → 다시 SSH)** 해야 합니다.

---

### 4. 서버 접속 및 보안/로그 수칙

#### 🔑 서버 접속 (SSH)
- **SSM 방식 (우리방식)**: AWS 콘솔에서 '연결' 버튼을 누르면 브라우저 터미널로 즉시 접속 가능합니다.
- **SSH 터미널 방식**: `FB-Key.pem` 파일을 사용하는 경우, 보안을 위해 아래 명령어로 권한을 먼저 수정해야 합니다.
  ```bash
  chmod 400 FB-Key.pem
  ssh -i "FB-Key.pem" ubuntu@3.94.108.113
  ```

#### 🌐 개발자 IP 등록 (필수)
로컬 PC에서 서버(SSH)나 DB(DBeaver)에 직접 접속하려면 보안 그룹에 본인의 IP가 등록되어야 합니다.
- **대상 보안 그룹**: `FB-Web-SG` (또는 현재 설정된 `launch-wizard-1`)
- **방법**: 담당자(김지윤)에게 본인의 공인 IP를 알려주거나, 직접 AWS 콘솔에서 인바운드 규칙에 추가해 주세요.

#### 🔒 보안 준수 사항 (Secrets)
- **비밀번호 숨기기**: 절대 `application.yml`이나 코드에 진짜 비밀번호를 적지 마세요.
- **방법 A: `.gitignore` 설정**
  ```text
  # 민감 파일 제외 필수
  .env
  .env.local
  *.pem
  ```
- **방법 B: 환경 변수 활용 (Spring Boot 예시)**
  ```yaml
  spring:
    datasource:
      password: ${DB_PASSWORD}  # 실행 시점에 환경 변수에서 주입
  ```
- **주의**: 우리 DB_PASSWORD는 **슬랙 m 양평**에 공지되어 있습니다. `.env` 파일은 절대 GitHub에 Push 하지 마세요.

#### 📝 로그 관리 (Logging)
- **파일 저장**: 서버가 꺼져도 로그가 남도록 **EC2 서버의 `~/logs` 폴더**에 저장해야 합니다.
- **애플리케이션 설정 (Spring Boot)**:
  ```yaml
  logging:
    file:
      path: /app/logs
    logback:
      rollingpolicy:
        max-history: 30
  ```
- **배포 설정 (Docker Compose)**:
  ```yaml
  services:
    backend:
      volumes:
        - /home/ubuntu/logs/backend:/app/logs
      environment:
        - DB_PASSWORD=${DB_PASSWORD}
  ```

---

## 👥 팀원
| 이름 | 역할 |
|------|------|
| 김지윤 | 인프라 및 기반 설계 |
| - | - |
| - | - |
| - | - |
| - | - |
| - | - |