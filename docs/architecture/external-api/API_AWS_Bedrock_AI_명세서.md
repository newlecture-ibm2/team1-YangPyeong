# 🔗 Amazon Bedrock (Claude 3.5 Sonnet) AI 연동 기능명세서

> **문서 ID:** EXT-AI-002  
> **작성일:** 2026-04-23  
> **버전:** v1.1  
> **관련 기능:** FRM-002 (AI 작물 추천 — RAG 보강), GOV-002 (정책 상담), ADM-001 (에이전트 자동화)  
> **관련 ERD:** `balance_data`, `crops`, `farms`  
> **연계 서비스:** Amazon S3, AWS Lambda, OpenSearch Serverless

---

## 1. 개요

**Amazon Bedrock**은 AWS의 완전 관리형 서버리스 생성형 AI 서비스이다.  
FarmBalance 시스템에서 Bedrock은 **Gemini가 담당하지 않는 두 가지 영역**을 맡는다:

1. **RAG(Knowledge Base):** 우리 프로젝트의 내부 문서(농업 매뉴얼 PDF, 정부 보조금 지침서, 논문)를 검색하여 답변하는 **전문 상담**
2. **Agent:** 단순히 답변하는 것을 넘어, 실제 시스템 내부 API를 호출하여 **업무를 자동 수행**

### 1.1 Gemini vs Bedrock 역할 분담

| 구분 | Gemini 1.5 Flash (EXT-AI-001) | Bedrock Claude 3.5 (EXT-AI-002) |
| :--- | :--- | :--- |
| **핵심 역할** | 실시간 상담, 멀티모달(이미지 분석) | **내부 문서 RAG, 업무 자동화 Agent** |
| **데이터 소스** | 모델의 사전학습 지식 + 우리가 전달한 컨텍스트 | **S3에 업로드된 PDF/논문 (학습 없이 검색)** |
| **인증 방식** | API Key (URL 파라미터) | **AWS IAM Role (기업 인증)** |
| **데이터 학습** | ⚠️ 입력 데이터가 학습에 사용될 수 있음 | ✅ **입력 데이터 모델 학습 불가** (기업 보안) |
| **비용 모델** | Free Tier (1,500 RPD) | 종량제 (입출력 토큰 단가) |
| **활용 예시** | "이 포도 사진, 병명이 뭐야?" | "2026년 고추 재배 보조금 지침서에서 신청 자격 찾아줘" |

### 1.2 시스템 내 활용처

| 활용처 | 기능 ID | 입력 | 출력 | 모드 |
| :--- | :---: | :--- | :--- | :---: |
| **정책 문서 RAG 상담** | GOV-002 | 유저 질문 + S3 지식 베이스 | 관련 지침 인용 + 답변 | RAG |
| **전문 재배 기술 RAG** | FRM-003 | 재배 질문 + 기술 매뉴얼 PDF | 매뉴얼 기반 정밀 답변 | RAG |
| **비료 주문 에이전트** | ADM-001 | "비 오면 비료 주문 미뤄줘" | 날씨 확인 → 일정 자동 변경 | Agent |
| **수급 경보 에이전트** | COM-003 | 수급 비율 임계값 초과 | 관련 농민에게 자동 알림 발송 | Agent |
| **AI 추천 근거 보강** | FRM-002 | 점수 데이터 + 유사 작물 논문 | 논문 근거가 포함된 추천 사유 | RAG+Text |

---

## 2. 핵심 기능 상세

### 2.1 Knowledge Base (RAG 서비스)

복잡한 RAG 파이프라인(임베딩 → 벡터 DB → 검색 → 생성)을 **직접 구축하지 않는다.**  
AWS 콘솔에서 S3 버킷을 연결하면, Bedrock이 알아서 문서를 인덱싱하고 검색한다.

#### 2.1.1 RAG 동작 원리

```
┌────────────────────────────────────────────────────────────────┐
│  [사전 준비] AWS 콘솔에서 1회 설정                              │
│                                                                │
│  S3 버킷 (farmbalance-knowledge-base/)                         │
│    ├── 농업매뉴얼/                                             │
│    │   ├── 고추_재배_기술_지침서_2026.pdf                       │
│    │   ├── 딸기_비료_시비_표준.pdf                              │
│    │   └── 유기농_병해충_방제_가이드.pdf                        │
│    ├── 정부보조금/                                              │
│    │   ├── 2026_농림부_직불금_신청_안내.pdf                     │
│    │   └── 양평군_귀농지원금_지침.pdf                           │
│    └── 논문/                                                   │
│        ├── 소규모_농가_수익성_분석_2024.pdf                     │
│        └── 양평군_기후변화_작물영향_연구.pdf                    │
│                                                                │
│  → Bedrock이 자동으로:                                         │
│    ① PDF 텍스트 추출                                           │
│    ② 청크(Chunk) 분할 (512토큰 단위)                           │
│    ③ 임베딩 벡터 생성                                          │
│    ④ OpenSearch Serverless에 저장                              │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  [런타임] 유저 질문 시                                          │
│                                                                │
│  유저: "2026년 고추 재배 보조금 신청 자격이 뭐야?"             │
│    │                                                           │
│    ▼                                                           │
│  RetrieveAndGenerate API 호출                                  │
│    │                                                           │
│    ├── ① 질문 → 임베딩 벡터 변환                               │
│    ├── ② OpenSearch에서 유사 문서 청크 검색 (Top-K)             │
│    ├── ③ 검색된 청크 + 질문을 Claude에게 전달                   │
│    └── ④ Claude가 문서 근거를 인용하며 답변 생성                │
│                                                                │
│  응답: "농림부 직불금 신청 안내에 따르면,                       │
│         고추 재배 보조금 신청 자격은... (출처: p.12)"            │
└────────────────────────────────────────────────────────────────┘
```

#### 2.1.2 지식 베이스 데이터 소스 관리

| S3 경로 | 문서 유형 | 예상 문서 수 | 갱신 주기 |
| :--- | :--- | :---: | :--- |
| `농업매뉴얼/` | 재배 기술 지침서, 비료·농약 사용법 | ~30건 | 연 1회 (신규 발간 시) |
| `정부보조금/` | 보조금·직불금 신청 안내, 지자체 지원금 | ~10건 | 연 1~2회 (정책 변경 시) |
| `논문/` | 농업 경제 분석, 기후 영향 연구 | ~20건 | 수시 (관련 논문 발굴 시) |
| `내부데이터/` | FarmBalance 이용 가이드, FAQ | ~5건 | 기능 업데이트 시 |

> 📌 **S3에 새 PDF를 업로드하면**, AWS 콘솔에서 "데이터 소스 동기화(Sync)" 버튼을 클릭하면  
> 자동으로 인덱싱이 갱신된다. 코드 변경 없이 지식이 확장된다.

### 2.2 Agent (에이전트 서비스)

AI가 **스스로 판단**하여 시스템 내부 API를 호출하고 결과를 조합한다.

#### 2.2.1 Action Group 정의

에이전트가 실행할 수 있는 함수(=Lambda 연결)를 사전 등록한다.

| Action Group 명 | 연결 Lambda | 동작 | 활용 시나리오 |
| :--- | :--- | :--- | :--- |
| `CheckWeather` | `farmbalance-weather-lambda` | 기상청 API 호출 → 예보 반환 | "내일 양평 비 와?" |
| `GetCropBalance` | `farmbalance-balance-lambda` | `balance_data` 조회 → 수급 상태 | "고추 수급 상황 어때?" |
| `UpdateCropPlan` | `farmbalance-plan-lambda` | `seed_registrations` 데이터 수정 | "비료 주문 3일 뒤로 미뤄줘" |
| `SendNotification` | `farmbalance-notify-lambda` | 알림 발송 트리거 | "수급 과잉 농민들한테 알림 보내줘" |

#### 2.2.2 에이전트 대화 시나리오 예시

```
유저: "내일 비 예보 있으면 비료 주문을 3일 뒤로 미뤄줘"
    │
    ▼
Agent 추론:
    ├── 1단계: CheckWeather("양평", "내일") 호출
    │          → 결과: "내일 강수확률 80%, 비 예보"
    │
    ├── 2단계: 조건 충족 판단 (비 예보 있음)
    │
    ├── 3단계: UpdateCropPlan(plan_id, +3일) 호출
    │          → 결과: "비료 주문 일정이 4/26 → 4/29로 변경됨"
    │
    └── 4단계: 종합 응답 생성
              "내일 양평군에 비 예보(강수확률 80%)가 있어서,
               비료 주문 일정을 4월 29일로 3일 미뤘습니다."
```

---

## 3. API 호출 상세 (Request)

### 3.1 호출 정보

| 항목 | Inference API | RetrieveAndGenerate API | Agent API |
| :--- | :--- | :--- | :--- |
| **Endpoint** | `bedrock-runtime.{region}.amazonaws.com` | `bedrock-agent-runtime.{region}.amazonaws.com` | `bedrock-agent-runtime.{region}.amazonaws.com` |
| **Method** | `POST /model/{modelId}/invoke` | `POST /retrieveAndGenerate` | `POST /agents/{agentId}/agentAliases/{aliasId}/sessions/{sessionId}/text` |
| **Auth** | AWS Signature V4 (IAM) | AWS Signature V4 (IAM) | AWS Signature V4 (IAM) |
| **SDK** | AWS SDK for Java v2 | AWS SDK for Java v2 | AWS SDK for Java v2 |

### 3.2 단순 추론 (Inference) Payload

```json
{
  "modelId": "anthropic.claude-3-5-sonnet-20240620-v1:0",
  "contentType": "application/json",
  "body": {
    "anthropic_version": "bedrock-2023-05-31",
    "system": "너는 양평군 농업 전문 컨설턴트야. 내부 데이터를 근거로 정확하게 답변해.",
    "messages": [
      {
        "role": "user",
        "content": "고추 재배 시 적정 pH 범위가 어떻게 되나요?"
      }
    ],
    "max_tokens": 1024,
    "temperature": 0.2
  }
}
```

### 3.3 RAG (RetrieveAndGenerate) Payload

```json
{
  "input": {
    "text": "2026년 고추 재배 보조금 신청 자격을 알려줘"
  },
  "retrieveAndGenerateConfiguration": {
    "type": "KNOWLEDGE_BASE",
    "knowledgeBaseConfiguration": {
      "knowledgeBaseId": "KB12345ABCD",
      "modelArn": "arn:aws:bedrock:ap-northeast-2::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0",
      "retrievalConfiguration": {
        "vectorSearchConfiguration": {
          "numberOfResults": 5
        }
      }
    }
  }
}
```

### 3.4 요청 파라미터 상세

| 필드 | 필수 | 값(예시) | 설명 |
| :--- | :---: | :--- | :--- |
| `modelId` / `modelArn` | Y | `anthropic.claude-3-5-sonnet-...` | 사용 모델 코드. Bedrock 콘솔에서 확인 |
| `knowledgeBaseId` | RAG 시 Y | `KB12345ABCD` | AWS 콘솔에서 생성한 지식 베이스 고유 ID |
| `agentId` / `agentAliasId` | Agent 시 Y | `AGENT1234` / `ALIAS5678` | Agent 및 배포 별칭 ID |
| `system` | N | 페르소나 지시문 | Inference 시 시스템 프롬프트 |
| `messages[].content` | Y | 유저 질문 | 대화 메시지 |
| `max_tokens` | N | `1024` | 최대 응답 토큰 수 |
| `temperature` | N | `0.2` | 낮을수록 정확 — 문서 기반 답변이므로 낮게 유지 |
| `numberOfResults` | N | `5` | RAG 검색 시 반환할 문서 청크 수 (Top-K) |

---

## 4. 보안 및 인증 체계

### 4.1 IAM 기반 인증 (API Key 없음)

Bedrock은 일반적인 API Key를 사용하지 않는다. **AWS IAM 역할(Role)**로 권한을 관리한다.

| 환경 | 인증 방식 | 설정 위치 |
| :--- | :--- | :--- |
| **로컬 개발** | IAM User Access Key + Secret Key | `.env` → `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| **EC2/ECS 배포** | IAM Instance Role 직접 부여 (권장) | AWS 콘솔 → IAM → Role 할당 |
| **Lambda** | Lambda 실행 역할에 Bedrock 권한 추가 | IAM Policy 설정 |

### 4.2 필요한 IAM 정책

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:Retrieve",
        "bedrock:RetrieveAndGenerate",
        "bedrock:InvokeAgent"
      ],
      "Resource": "*"
    }
  ]
}
```

### 4.3 데이터 프라이버시 (Gemini와의 핵심 차이)

| 항목 | Gemini | Bedrock |
| :--- | :--- | :--- |
| 입력 데이터 학습 | ⚠️ 학습에 활용될 수 있음 | ✅ **절대 학습에 사용되지 않음** |
| 데이터 전송 구간 | 공공 인터넷 | **AWS 내부 네트워크 (VPC 엔드포인트 지원)** |
| 감사 추적 | 제한적 | **AWS CloudTrail 완전 추적** |

> 📌 이 차이 때문에 **민감한 내부 데이터(보조금 신청서, 농가 개인정보 포함 문서)**는  
> Gemini가 아닌 **Bedrock을 통해서만 처리**한다.

---

## 5. 비용 관리

### 5.1 요금 구조

| 항목 | 과금 기준 | 예상 단가 (ap-northeast-2 기준) |
| :--- | :--- | :--- |
| **Inference (Claude 3.5)** | 입력/출력 토큰 수 | 입력 $3.00/1M토큰, 출력 $15.00/1M토큰 |
| **Knowledge Base 검색** | 검색 쿼리 횟수 | ~$0.01/1,000쿼리 |
| **OpenSearch Serverless** | 인덱싱 시간 + 검색 시간 (OCU) | ~$0.24/OCU-hour |
| **S3 저장** | 데이터 보관량 | ~$0.025/GB/월 (극소량) |

### 5.2 일별 비용 예상

| 기능 | 1일 예상 호출 | 평균 토큰 | 예상 일비용 |
| :--- | :---: | :---: | :---: |
| RAG 상담 | ~50회 | 입력 1K + 출력 500 | ~$0.53 |
| Agent 실행 | ~20회 | 입력 2K + 출력 1K | ~$0.42 |
| 단순 추론 | ~30회 | 입력 500 + 출력 300 | ~$0.18 |
| **합계** | **~100회/일** | — | **~$1.13/일** |

> 📌 월 예상 비용: **약 $34 (≈ 45,000원)**. 프로젝트 규모에서 합리적인 수준.

### 5.3 비용 최적화 전략

| 전략 | 설명 |
| :--- | :--- |
| **RAG 응답 캐싱** | 동일 질문 → Redis 캐시 (TTL 24시간). 보조금 FAQ 등 반복 질문 절감 |
| **Agent 호출 제한** | 관리자 전용 기능으로 한정. 일반 유저 직접 호출 차단 |
| **OpenSearch OCU 최소화** | 검색 OCU 최소 2, 인덱싱 OCU 최소 2로 설정. 피크 시간대만 자동 스케일링 |
| **프로젝트 종료 시 정리** | ⚠️ **반드시** Knowledge Base 인스턴스 + OpenSearch 컬렉션 삭제 → 과금 방지 |

---

## 6. 예외 처리

### 6.1 에러 코드

| ErrorCode | HTTP | 상황 | 대응 |
| :--- | :---: | :--- | :--- |
| `THROTTLING_EXCEPTION` | 429 | 초당 호출 횟수 초과 | Exponential Backoff (1초→2초→4초) 최대 3회 재시도 |
| `ACCESS_DENIED_EXCEPTION` | 403 | IAM 권한 부족 | 관리자에게 IAM 정책 점검 알림 |
| `MODEL_NOT_READY` | 503 | 모델 로딩 중 (콜드 스타트) | 5초 대기 후 재시도 |
| `VALIDATION_EXCEPTION` | 400 | 입력 토큰 초과 / 잘못된 파라미터 | 입력 트리밍 후 재전송 |
| `KB_SYNC_REQUIRED` | 200 | S3 문서 변경 후 미동기화 | 관리자에게 "데이터 소스 동기화 필요" 알림 |

### 6.2 Fallback 전략

| 장애 상황 | Fallback |
| :--- | :--- |
| Bedrock API 다운 | **Gemini로 자동 전환** (RAG 없이 일반 응답) + "내부 문서 참조 불가" 안내 |
| Knowledge Base 검색 0건 | "관련 문서를 찾지 못했습니다. 질문을 더 구체적으로 해주세요" 안내 |
| Agent Lambda 실행 실패 | 해당 작업을 **수동으로 진행할 수 있는 화면 링크** 제공 |
| OpenSearch 장애 | Bedrock Inference(RAG 없이)로 Fallback |
| IAM 권한 오류 | 관리자 대시보드에 즉시 알림 + 기능 일시 비활성화 |

### 6.3 Retry 정책

```
최대 재시도: 3회
대기 전략: Exponential Backoff (1초 → 2초 → 4초)
타임아웃: Inference 15초, RAG 20초, Agent 30초
Circuit Breaker: 5분 내 5회 연속 실패 시 60초간 차단
```

---

## 7. 시스템 아키텍처

### 7.1 전체 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Spring Boot (Infra 계층)                      │
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐        │
│  │  BedrockKnowledgeBase    │  │  BedrockAgentClient      │        │
│  │  Client (RAG)            │  │  (에이전트)               │        │
│  │                          │  │                          │        │
│  │  호출:                    │  │  호출:                    │        │
│  │  - 유저 질문 수신         │  │  - 유저 명령 수신         │        │
│  │  - knowledgeBaseId 주입   │  │  - agentId 주입          │        │
│  │  - RetrieveAndGenerate   │  │  - InvokeAgent           │        │
│  │                          │  │                          │        │
│  │  응답:                    │  │  응답:                    │        │
│  │  - 답변 텍스트            │  │  - 실행 결과 텍스트       │        │
│  │  - 인용 출처 (문서명, 페이지)│ │  - 실행된 Action 로그    │        │
│  │  - 면책 문구 추가         │  │  - 면책 문구 추가         │        │
│  └────────────┬─────────────┘  └────────────┬─────────────┘        │
│               │                              │                     │
│               └──────────┬───────────────────┘                     │
│                          │                                         │
│                          ├──→ Redis 캐시 (RAG 답변: TTL 24h)        │
│                          ├──→ 대화 이력 DB 저장                      │
│                          └──→ BFF → 프론트엔드                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 RAG 상담 UI 요소

```
┌─────────────────────────────────────────┐
│  💬 FarmBalance 전문 상담 (Bedrock)       │
│                                         │
│  Q: "고추 재배 보조금 신청 자격이 뭐야?" │
│                                         │
│  A: 2026년 농림부 직불금 신청 안내에      │
│     따르면, 고추 재배 보조금 신청         │
│     자격은 다음과 같습니다:               │
│     1. 경작 면적 300평 이상              │
│     2. 농업경영체 등록 필수              │
│     3. 신청 기간: 2026.03.01 ~ 03.31    │
│                                         │
│  📄 출처: 2026_농림부_직불금_신청_안내.pdf │
│           (12페이지)                     │
│                                         │
│  ⚠️ AI 답변은 참고용이며, 정확한 내용은   │
│     해당 기관에 직접 확인하세요.           │
│                                         │
│  Powered by Amazon Bedrock (Claude 3.5)  │
│  👍  👎                                 │
└─────────────────────────────────────────┘
```

> 📌 **Gemini 응답과 다른 핵심 차이:** Bedrock RAG 응답에는 **"출처: 문서명 (페이지)"**가 자동 포함된다.  
> 이는 할루시네이션 검증에 매우 유리하다 — 유저가 직접 원본 PDF를 확인할 수 있다.

---

## 8. 보안 및 운영

| 항목 | 정책 |
| :--- | :--- |
| **인증 키 관리** | `.env` → `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`. 배포 시 IAM Role 전환 |
| **호출 경로** | Spring Boot Infra 계층 전용. 프론트엔드 직접 호출 절대 금지 |
| **네트워크 격리** | VPC Endpoint를 통해 AWS 내부 네트워크로만 통신 (공공 인터넷 미경유) |
| **감사 추적** | AWS CloudTrail을 통한 모든 API 호출 감사 로그 자동 기록 |
| **Rate Limiting** | 유저당 분당 5회, 일당 50회 RAG 호출 제한 |
| **Agent 접근 제한** | Agent 기능은 **ROLE_ADMIN 전용**. 일반 농민은 RAG 상담만 허용 |

---

## 9. 환경변수

| 환경변수명 | 용도 | 사용 환경 |
| :--- | :--- | :---: |
| `AWS_ACCESS_KEY_ID` | IAM 인증 | 로컬 개발 전용 |
| `AWS_SECRET_ACCESS_KEY` | IAM 인증 | 로컬 개발 전용 |
| `AWS_REGION` | 리전 설정 | `ap-northeast-2` (서울) |
| `BEDROCK_KB_ID` | Knowledge Base ID | 모든 환경 |
| `BEDROCK_AGENT_ID` | Agent ID | 모든 환경 |
| `BEDROCK_AGENT_ALIAS_ID` | Agent 배포 별칭 | 모든 환경 |

---

## 10. 구현 패키지 구조

```
backend/src/main/java/com/farmbalance/infra/external/aws/
├── config/
│   └── AwsBedrockConfig.java              # AWS SDK 클라이언트 Bean 설정 (리전, 인증)
│
├── bedrock/
│   ├── BedrockInferenceClient.java        # 단순 추론 (텍스트 생성) 호출
│   ├── BedrockKnowledgeBaseClient.java    # RAG (RetrieveAndGenerate) 호출
│   ├── BedrockAgentClient.java            # Agent (InvokeAgent) 호출
│   ├── BedrockResponseParser.java         # 응답 파싱 + 출처 정보 추출
│   └── dto/
│       ├── BedrockInferenceRequestDto.java
│       ├── BedrockRagRequestDto.java
│       ├── BedrockRagResponseDto.java     # 답변 + citations[] (출처 목록)
│       ├── BedrockAgentRequestDto.java
│       └── BedrockAgentResponseDto.java
│
└── lambda/
    ├── CheckWeatherLambda.java            # 날씨 확인 Action Group
    ├── GetCropBalanceLambda.java           # 수급 조회 Action Group
    ├── UpdateCropPlanLambda.java           # 일정 변경 Action Group
    └── SendNotificationLambda.java        # 알림 발송 Action Group

frontend/src/components/ai/
├── RagConsultChat.tsx                      # RAG 전문 상담 UI (출처 표시 포함)
└── AgentCommandPanel.tsx                  # 관리자 전용 Agent 명령 패널
```

---

## 11. 프로젝트 종료 시 필수 정리 체크리스트

> ⚠️ **Bedrock은 서버리스이지만, 아래 리소스를 삭제하지 않으면 과금이 계속된다.**

| 리소스 | 삭제 위치 | 과금 항목 |
| :--- | :--- | :--- |
| Knowledge Base | Bedrock 콘솔 → Knowledge bases → 삭제 | OpenSearch OCU 시간당 과금 |
| OpenSearch Serverless 컬렉션 | OpenSearch 콘솔 → Collections → 삭제 | 인덱싱/검색 OCU |
| S3 버킷 데이터 | S3 콘솔 → 버킷 비우기 + 삭제 | 저장 용량 (극소량) |
| Provisioned Throughput | Bedrock 콘솔 → Provisioned → 삭제 | 예약 용량 시간당 과금 |
| Agent + Lambda | Bedrock 콘솔 + Lambda 콘솔 | Lambda 호출 수 (극소량) |

---

> 📌 **다음 단계:**  
> ① AWS Bedrock 콘솔에서 Claude 3.5 Sonnet **모델 액세스 요청** (리전: ap-northeast-2)  
> ② S3 버킷 생성 → 테스트용 농업 PDF 3건 업로드 → Knowledge Base 생성 및 동기화  
> ③ Spring Boot `build.gradle`에 AWS SDK v2 의존성 추가:  
>    `implementation 'software.amazon.awssdk:bedrockruntime:2.x.x'`  
> ④ Agent Action Group Lambda 함수 1건(`CheckWeather`) 시범 구현 및 테스트
