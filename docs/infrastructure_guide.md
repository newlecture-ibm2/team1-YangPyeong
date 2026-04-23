# 🏗️ FarmBalance 인프라 및 개발 환경 가이드

본 문서는 FarmBalance 프로젝트의 AWS 인프라 구성 정보와 이를 실제 개발 환경에서 사용하는 방법을 정의합니다.

---

## 1. 인프라 상세 스펙 (Infrastructure Specs)

### 🖥️ 애플리케이션 서버 (EC2)
*   **이름**: `FB-App-Server`
*   **OS**: Ubuntu 22.04 LTS
*   **인스턴스 유형**: `t3.medium` (vCPU 2, RAM 4GB)
*   **스토리지**: EBS 30GB (gp3)
*   **보안 그룹 (`launch-wizard-1`)**:
    *   Inbound: SSH(22), HTTP(80), HTTPS(443), Custom(8000)
*   **퍼블릭 IPv4**: `3.94.108.113`
*   **접속 방식**: AWS SSM Session Manager (PEM 키 없이 콘솔에서 접속 가능)

### 🗄️ 데이터베이스 (RDS)
*   **엔진**: PostgreSQL 16.x / 17.x
*   **클래스**: `db.t4g.micro` (Burstable Class)
*   **스토리지**: 20GB (gp3)
*   **초기 데이터베이스명**: `farmbalance`
*   **보안 그룹 (`FB-DB-SG`)**: 
    *   Inbound: 5432 (웹 서버 보안 그룹만 허용)

### 🪣 오브젝트 스토리지 (S3)
*   **버킷명**: `farmbalance-storage-2026`
*   **리전**: `us-east-1` (버지니아 북부)
*   **권한**: ACL 활성화됨 (객체 소유권: 버킷 소유자 선호)

### 🤖 AI 엔진 (Bedrock)
*   **모델**: Anthropic Claude 3 (Sonnet/Haiku)
*   **권한**: EC2 인스턴스에 IAM Role을 통해 직접 부여됨

---

## 2. 실제 개발 사용 가이드 (Development Guide)

### 2.1 데이터베이스 연결 (DB Connection)
개발자는 각자 환경에서 다음 정보를 사용하여 DB에 연결합니다.

*   **URL**: `jdbc:postgresql://farmbalance-db.cwt02w6i4a4b.us-east-1.rds.amazonaws.com:5432/farmbalance`
*   **사용자명/암호**: `postgres` / `[별도공지]`
*   **도구 추천**: **DBeaver** 또는 **IntelliJ Database Tab** 사용.
*   **참고**: 본인의 로컬에서 접속이 안 될 경우, 인프라 담당자에게 본인 IP를 알려주어 보안 그룹에 등록해야 합니다.

### 2.2 S3 파일 업로드 (File Upload)
사용자가 업로드한 파일(영수증, 증명서 등)을 처리할 때 사용합니다.

*   **방식**: AWS SDK (Spring: `awssupport`, Python: `boto3`)를 사용합니다.
*   **인증**: 서버(EC2)에 이미 IAM Role이 부여되어 있으므로, 코드 내에 **Access Key를 직접 넣지 마세요.** SDK가 자동으로 서버의 권한을 가져옵니다.
*   **저장 구조**: `s3://farmbalance-storage-2026/images/` 처럼 폴더 구조를 만들어 관리하세요.

### 2.3 배포 프로세스 (Deployment)
작성된 코드를 서버에 반영하는 순서입니다.

1.  **Dockerizing**: 각 모듈(Spring, FastAPI, Next.js)을 Docker 이미지로 빌드합니다.
2.  **Transfer**: 이미지를 서버로 전송하거나 서버에서 직접 빌드합니다.
3.  **Run**: 서버 내에서 `docker-compose up -d` 명령어로 서비스를 실행합니다.
4.  **Health Check**: `curl http://localhost:8000` 등으로 정상 작동 여부를 확인합니다.

### 2.4 AI 기능 호출
*   Bedrock API를 호출할 때 리전 설정을 반드시 `us-east-1`으로 지정해야 합니다.
*   모델 ID: `anthropic.claude-3-sonnet-20240229-v1:0` (또는 Haiku)

---

## 3. 공통 준수 사항
*   **보안**: 어떤 경우에도 AWS Access Key나 DB 비밀번호를 GitHub 공개 저장소에 올리지 마세요. (환경 변수 `.env` 또는 AWS Secrets Manager 사용 권장)
*   **로그**: 모든 애플리케이션 로그는 서버 내 특정 디렉토리에 저장되도록 설정하세요.
