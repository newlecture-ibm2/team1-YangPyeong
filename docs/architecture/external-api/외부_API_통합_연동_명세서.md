# 🌐 외부 API 통합 연동 기능명세서

> **문서 ID:** EXT-TOTAL-001  
> **작성일:** 2026-04-23  
> **최종 수정:** 2026-04-26 (신규 테이블 6개 반영, 농사로 cropEbook 교체, 흙토람 SoilExam/SoilFitStat 추가)
> **버전:** v3.0  
> **기술 표준:** `지윤02_기능명세서.md` §0 준수  
> **관련 ERD:** `weather_data`, `soil_exam_data`, `crop_production_stats`, `soil_fitness_data`, `crop_guides`, `pest_occurrence_reports`, `farms`, `crops`

---

## 1. 개요

FarmBalance 시스템은 **5종의 데이터 수집 API**와 **2종의 클라우드 AI 서비스**를 유기적으로 결합한다.  
유저의 주소 입력 한 번으로 날씨·토양·재배법·통계 데이터를 자동 수집하고, AI가 이를 해석하여 **개인화된 영농 리포트**를 완성한다.

본 문서는 개별 API 명세서 7종을 관통하는 **시스템 수준의 통합 설계**를 정의한다.

### 1.1 개별 명세서 목록

| 문서 ID | 명세서 | 핵심 역할 |
| :---: | :--- | :--- |
| EXT-MAP-001 | [🗺️ 카카오맵 위치서비스](./API_카카오맵_위치서비스_명세서.md) | 좌표·법정동 코드 획득 — **모든 연동의 시작점** |
| EXT-WEATHER-001 | [🌦️ 기상청 통합 연동](./API_기상청_통합_연동_명세서.md) | 실시간 예보 + 10년 ASOS 기후 통계 |
| EXT-SOIL-001 | [🧪 흙토람 토양정보](./API_흙토람_토양정보_명세서.md) | PNU 기반 토양 7종 화학 성분 분석 |
| EXT-FARM-001 | [📖 농사로 재배기술·병해충](./API_농사로_재배기술_명세서.md) | 재배 길잡이 PDF + 병해충 발생정보 보고서 |
| EXT-STAT-001 | [📊 KOSIS 생산량통계](./API_KOSIS_생산량통계_명세서.md) | 10년 연도별·지역별 생산량 공식 통계 |
| EXT-AI-001 | [🤖 Google Gemini AI](./API_Google_Gemini_AI_명세서.md) | 이미지 병해충 진단, 추천 사유 생성, 데이터 요약 |
| EXT-AI-002 | [🔗 AWS Bedrock AI](./API_AWS_Bedrock_AI_명세서.md) | 내부 문서 RAG 상담, 업무 자동화 Agent |

---

## 2. 통합 데이터 파이프라인

### 2.1 실시간 파이프라인 (유저 행동 트리거)

```
┌──────────────────────────────────────────────────────────────────┐
│  [유저] 농장 주소 입력: "경기도 양평군 양서면 복포리 123-4"        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  ① 카카오맵 API (EXT-MAP)     │
              │  주소 → 위경도(x, y)          │
              │  주소 → 법정동코드 + 번지      │
              └──────┬───────────────┬────────┘
                     │               │
          ┌──────────▼──────┐  ┌─────▼──────────────────┐
          │  ② 기상청 API    │  │  ③ 흙토람 API           │
          │  (EXT-WEATHER)  │  │  (EXT-SOIL)            │
          │                 │  │                        │
          │  (x,y)          │  │  법정동 + 번지           │
          │  → GridConvert  │  │  → PnuCodeGenerator    │
          │  → (nx=63,ny=89)│  │  → PNU 코드 조립        │
          │  → 실시간 예보   │  │  → 토양 7종 성분 조회   │
          └────────┬────────┘  └──────────┬─────────────┘
                   │                      │
                   │  기상 적합도 (12.5%)   │  토양 적합도 (12.5%)
                   │                      │
                   └──────────┬───────────┘
                              │
                              ▼
              ┌──────────────────────────────┐
              │  ④ AI 추천 엔진 (FRM-002)     │
              │                              │
              │  환경 적합도 (25%)             │
              │  = 기상(12.5%) + 토양(12.5%)  │
              │                              │
              │  + 수급 적합도 (35%)           │ ← KOSIS 데이터
              │  + 수익성 (25%)               │ ← KAMIS 데이터
              │  + 농가 역량 (15%)            │ ← 내부 DB
              │  = 종합 점수 (0~100)          │
              │                              │
              │  ⑤ Gemini: 추천 사유 생성     │
              │  "양평군에서 고추 공급이       │
              │   부족하여 재배를 권장합니다"   │
              └──────────────────────────────┘
```

### 2.2 배치 파이프라인 (스케줄러 트리거)

| 배치 | 스케줄 | 수집 대상 | 저장소 | 활용처 |
| :--- | :--- | :--- | :---: | :--- |
| `ClimateHistoryBatchJob` | 매일 03:00 | 기상청 ASOS 10년 기후 통계 | PostgreSQL | 기상 적합도 보정 (평년값) |
| `ProductionStatsBatchJob` | 매년 3월 1일 | KOSIS 10년 생산량 통계 | PostgreSQL | 수급 밸런스 기초 데이터 |
| `NongsaroPrefetchJob` | 주 1회 (월 06:00) | 농사로 주요 작물 TOP 20 가이드 | Redis + 로컬 | 재배 가이드 사전 캐싱 |

### 2.3 AI 지능 파이프라인

| 트리거 | AI 서비스 | 입력 | 출력 |
| :--- | :--- | :--- | :--- |
| 추천 요청 (FRM-002) | **Gemini** | 4항목 점수 데이터 | 추천 사유 문장 3개 |
| 사진 업로드 (FRM-003) | **Gemini** | 작물 사진 (Base64) | 병명 + 방제법 |
| 정책 질문 (GOV-002) | **Bedrock RAG** | 유저 질문 + S3 PDF | 문서 인용 답변 |
| 업무 명령 (ADM-001) | **Bedrock Agent** | "비료 주문 미뤄줘" | Lambda 실행 → 결과 |

---

## 3. AI 추천 점수와 외부 API 매핑

`수경02_기능명세서` FR-FM-002에 정의된 추천 점수 4항목이 어떤 외부 API 데이터를 소비하는지 정리한다.

```
종합 점수 = (수급 × 0.35) + (환경 × 0.25) + (수익성 × 0.25) + (역량 × 0.15)
```

| 점수 항목 (가중치) | 참조 외부 API | 참조 데이터 | ERD 테이블 |
| :--- | :--- | :--- | :--- |
| **수급 적합도** (35%) | KOSIS | 10년 생산량 추이 → 외부 공급 추정 | `balance_data.supply_ratio` |
| **환경 적합도** (25%) | 기상청 + 흙토람 | 기온·강수 + pH·유기물·인산 | `crops.climate_conditions` |
| **수익성** (25%) | KAMIS (※별도 명세 필요) | 최근 3년 평균 시장 가격 | — |
| **농가 역량** (15%) | 내부 DB 전용 | 재배 이력, 보유 시설 | `farms`, `seed_registrations` |
| **추천 사유 문장** | Gemini | 위 점수 + 작물 정보 → 자연어 변환 | — |

---

## 3-1. 외부 API 작물코드 관리 방침

외부 API 호출 시 필요한 작물코드는 **애플리케이션 코드(Enum/Map)**에서 직접 관리한다. 별도 DB 테이블은 사용하지 않는다.

| API | 작물코드 필드 | 예시 | 참고 명세서 |
| :--- | :--- | :--- | :--- |
| KOSIS 생산량통계 | `tblId` + `itmId` | `DT_1ET0291` + `T76` (양파:면적) | `API_KOSIS_생산량통계_명세서.md` §4.1 |
| 흙토람 토양적성 | `soil_Crop_CD` | `CR048` (양파) | `API_흙토람_토양정보_명세서.md` §6.4 |
| 농사로 재배길잡이 | `subCategoryCode` | `VC041201` (양파) | `API_농사로_재배기술_명세서.md` §4.2 |

> 📌 이러한 정적 매핑 데이터는 런타임에 변경되지 않으므로 DB가 아닌 코드/설정 파일로 관리하는 것이 적합하다.

---

## 4. 환경변수 및 API Key 총괄

모든 키는 `.env` 파일에서 관리하며, 코드 직접 기입을 **절대 금지**한다.

| 환경변수명 | API | 사용 위치 | 노출 |
| :--- | :--- | :---: | :---: |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 카카오맵 JS SDK | 프론트엔드 | ⚠️ 도메인 제한 보호 |
| `KAKAO_REST_API_KEY` | 카카오 REST API | 백엔드 Infra | ❌ 서버 전용 |
| `KMA_API_KEY` | 기상청 단기예보/ASOS | 백엔드 Infra | ❌ 서버 전용 |
| `SOIL_API_KEY` | 흙토람 토양정보 | 백엔드 Infra | ❌ 서버 전용 |
| `NONGSARO_API_KEY` | 농사로 재배기술 | 백엔드 Infra | ❌ 서버 전용 |
| `KOSIS_API_KEY` | KOSIS 생산량통계 | 백엔드 Infra | ❌ 서버 전용 |
| `GEMINI_API_KEY` | Google Gemini AI | 백엔드 Infra | ❌ 서버 전용 |
| `AWS_ACCESS_KEY_ID` | AWS Bedrock (로컬) | 백엔드 Infra | ❌ 배포 시 IAM Role 전환 |
| `AWS_SECRET_ACCESS_KEY` | AWS Bedrock (로컬) | 백엔드 Infra | ❌ 배포 시 IAM Role 전환 |
| `AWS_REGION` | AWS 리전 | 백엔드 Infra | `ap-northeast-2` |
| `BEDROCK_KB_ID` | Bedrock Knowledge Base | 백엔드 Infra | ❌ 서버 전용 |

### 호출 경로 원칙

```
카카오맵 JS SDK만 유일하게 브라우저 직접 로드 (도메인 제한 보호)

그 외 모든 API:
  브라우저 → Next.js BFF → Spring Boot Infra → 외부 API
  (httpOnly 쿠키 ↔ JWT)   (API Key 보관)

  → 브라우저에서 REST Key 절대 노출 안 됨
```

---

## 5. 캐싱 전략 총괄

| API | 캐시 대상 | 저장소 | TTL | 사유 |
| :--- | :--- | :---: | :---: | :--- |
| **카카오맵** | 주소→좌표 변환 | Redis | 7일 | 주소-좌표 매핑 불변 |
| **카카오맵** | 키워드 검색 결과 | Redis | 1시간 | 가게 정보 변동 가능 |
| **기상청** | 단기예보 데이터 | Redis | 3시간 | 3시간 단위 발표 |
| **기상청** | ASOS 10년 통계 | PostgreSQL | 일일 배치 | 장기 보관용 |
| **흙토람** | 토양 성분 데이터 | Redis | 24시간 | 토양 단기 불변 |
| **농사로** | 재배 가이드 HTML | Redis | 7일 | 내용 변동 적음 |
| **농사로** | 작물 이미지 | 로컬 스토리지 | 30일 | 서버 지연 대비 |
| **KOSIS** | 10년 생산량 통계 | PostgreSQL | 연 1회 배치 | 연 1회만 발표 |
| **Gemini** | 추천 근거 응답 | Redis | 1시간 | 동일 점수대 재활용 |
| **Bedrock** | RAG 상담 응답 | Redis | 24시간 | 보조금 FAQ 반복 절감 |

---

## 6. 에러 처리 통합 전략

### 6.1 공통 에러 래핑

```java
public class ExternalApiException extends RuntimeException {
    private final String apiName;       // "WEATHER", "SOIL", "GEMINI" 등
    private final String errorCode;     // "API_CONNECTION_FAIL"
    private final String correlationId; // X-Correlation-Id
}
```

### 6.2 API별 Fallback 체인

| 장애 API | 1차 Fallback | 2차 Fallback | 최종 Fallback |
| :--- | :--- | :--- | :--- |
| **기상청** | Redis 최종 캐시 | ASOS 평년 통계 (DB) | 기상 점수 50점 (중립) |
| **흙토람** | Redis 최종 캐시 | 읍면리 평균 토양 | 토양 점수 50점 (중립) |
| **카카오맵** | Redis 최종 캐시 | 주소 직접 입력 폼 전환 | — |
| **농사로** | Redis 최종 캐시 | `crops` 기본 정보 | "가이드 일시 불가" 안내 |
| **KOSIS** | DB 이전 배치 | 전년도 + 추세 예측 | 수급 점수 미반영 안내 |
| **Gemini** | 템플릿 문장 자동 조합 | 농사로 원문 그대로 표시 | "AI 일시 장애" 안내 |
| **Bedrock** | **Gemini로 자동 전환** | RAG 없이 일반 응답 | "문서 참조 불가" 안내 |

> 📌 **핵심 원칙:** 외부 API 1~2개가 다운되어도 **시스템 전체가 중단되지 않는다**.

### 6.3 통합 Retry 정책

| 항목 | 데이터 API | AI API |
| :--- | :--- | :--- |
| 최대 재시도 | 3회 | 2회 |
| 대기 전략 | Exponential Backoff | Fixed Delay 1초 |
| 대기 시간 | 1초 → 2초 → 4초 | 1초 → 1초 |
| 타임아웃 | 5초 (KOSIS 10초) | 10초 (Agent 30초) |
| Circuit Breaker | 3회 연속 실패 → 30초 차단 | 5회 연속 실패 → 60초 차단 |

---

## 7. 보안 체계

### 7.1 인증 이원화

| 방식 | 대상 API | 특징 |
| :--- | :--- | :--- |
| **API Key (REST)** | 기상청, 흙토람, 농사로, KOSIS, Gemini | `.env` 관리, BFF 경유 |
| **IAM Role (AWS)** | Bedrock | API Key 없음, 서버에 역할 부여 (가장 안전) |
| **도메인 제한** | 카카오맵 JS SDK | 등록한 도메인에서만 동작 |

### 7.2 AI 할루시네이션 방지 공통 수칙

| 요소 | Gemini | Bedrock |
| :--- | :--- | :--- |
| 면책 문구 | ⚠️ 모든 응답 하단 필수 | ⚠️ 모든 응답 하단 필수 |
| 출처 표기 | "Powered by Google Gemini" | **문서명 + 페이지** 자동 인용 |
| 확신도 뱃지 | 🟢높음 / 🟡중간 / 🔴낮음 | RAG 검색 점수 기반 |
| 피드백 수집 | 👍 / 👎 버튼 | 👍 / 👎 버튼 |
| 개인정보 | `PersonalInfoMasker`로 마스킹 후 전송 | ✅ 데이터 학습 불가 (기업 보안) |

---

## 8. 통합 패키지 구조

```
backend/src/main/java/com/farmbalance/infra/external/
│
├── common/
│   ├── ExternalApiException.java         # 공통 예외
│   ├── ExternalApiRetryPolicy.java       # 공통 Retry/CircuitBreaker
│   └── ExternalApiCacheManager.java      # 공통 Redis 캐시 매니저
│
├── kakao/                                # 카카오맵 (위치 허브)
├── weather/                              # 기상청 (실시간 + ASOS 배치)
├── soil/                                 # 흙토람 (PNU + 토양)
├── nongsaro/                             # 농사로 (2-Step + HTML 정제)
├── kosis/                                # KOSIS (연 1회 배치 + 매핑)
│
├── ai/                                   # Google Gemini
│   ├── GeminiApiClient.java
│   ├── PromptTemplateManager.java
│   ├── ImageBase64Converter.java
│   ├── PersonalInfoMasker.java
│   └── GeminiResponseParser.java
│
└── aws/                                  # AWS Bedrock
    ├── config/AwsBedrockConfig.java
    └── bedrock/
        ├── BedrockInferenceClient.java
        ├── BedrockKnowledgeBaseClient.java
        ├── BedrockAgentClient.java
        └── BedrockResponseParser.java
```

---

## 9. 구현 로드맵

| 단계 | 구현 대상 | 핵심 과제 | 선행 조건 |
| :---: | :--- | :--- | :--- |
| **Phase 1** | 카카오맵 + 기상청 | 좌표 획득 → 격자 변환 → 실시간 예보 | 카카오 앱 등록, 도메인 설정 |
| **Phase 2** | 흙토람 | PNU 조립 → 토양 성분 → 판정 | Phase 1의 법정동 코드 |
| **Phase 3** | KOSIS 배치 | 10년 통계 적재 → `balance_data` 보정 | 작물-코드 매핑 테이블 |
| **Phase 4** | Gemini AI | 추천 사유 생성 + 이미지 진단 + 요약 | Phase 1~3 데이터 준비 |
| **Phase 5** | Bedrock AI | S3 PDF → Knowledge Base → RAG 상담 | AWS 모델 액세스 승인 |
| **Phase 6** | 농사로 + 고도화 | HTML 정제 + Fallback + Circuit Breaker | 전체 API 안정화 후 |

---

## 10. ERD 변경 이력 (반영 완료)

> ✅ 아래 변경은 ERD v2.0에 **반영 완료**되었습니다.

| 대상 테이블 | 변경 내용 | 상태 |
| :--- | :--- | :---: |
| `farms` | `latitude`, `longitude` DECIMAL 추가 | ✅ 반영 완료 |
| `farms` | `bjd_code`, `pnu_code` 추가 | ✅ 반영 완료 |
| `crops` | `climate_conditions` JSONB (기상+토양 통합) | ✅ 반영 완료 |
| ~~`crop_external_codes`~~ | ~~KOSIS/SOIL_FIT/NONGSARO 코드 통합 매핑~~ | ❌ 삭제 (애플리케이션 코드로 대체) |
| `weather_data` | ASOS 10년 기후 이력 | ✅ 신규 생성 |
| `crop_production_stats` | KOSIS 생산량 이력 | ✅ 신규 생성 |
| `soil_exam_data` | 흙토람 토양 화학성 | ✅ 신규 생성 |
| `soil_fitness_data` | 흙토람 토양적성 | ✅ 신규 생성 |
| `crop_guides` | 농사로 재배 길잡이 | ✅ 신규 생성 |
| `pest_occurrence_reports` | 농사로 병해충 발생정보 | ✅ 신규 생성 |

---

## 11. 법적 준수 사항

| 데이터 | 화면 하단 표기 문구 |
| :--- | :--- |
| 기상청 예보 | "출처: 기상청" |
| 흙토람 토양 | "출처: 농촌진흥청 흙토람" |
| 농사로 재배 정보 | "출처: 농촌진흥청 농사로" |
| KOSIS 통계 | "출처: 통계청 KOSIS" |
| 카카오맵 지도 | 카카오맵 SDK 자체 워터마크 (자동) |
| Gemini AI 답변 | "Powered by Google Gemini" + 면책 문구 |
| Bedrock AI 답변 | "Powered by Amazon Bedrock" + 출처 인용 + 면책 문구 |

---

> 📌 **다음 단계:**  
> ① KAMIS(농산물 가격) API 명세서 작성 (EXT-PRICE-001) — 수익성 점수(25%) 핵심 데이터  
> ② Phase 1 구현 시작: 카카오맵 앱 등록 + `GridCoordinateConverter` 단위 테스트
