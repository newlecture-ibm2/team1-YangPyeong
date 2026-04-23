# 🌐 외부 API 통합 연동 기능명세서

> **문서 ID:** EXT-TOTAL-001  
> **작성일:** 2026-04-23  
> **버전:** v1.0  
> **기술 표준:** `지윤02_기능명세서.md` §0 준수  
> **관련 ERD:** `balance_data`, `crops`, `farms`, `stores`, `crop_plans`

---

## 1. 개요

FarmBalance 시스템은 **5종의 외부 API**를 유기적으로 결합하여, 유저의 주소 입력 한 번으로 날씨·토양·재배법·통계 데이터를 자동 수집하고, 이를 AI 작물 추천 엔진의 입력값으로 활용한다.

본 문서는 개별 API 명세서를 관통하는 **시스템 수준의 통합 설계**를 정의한다.

### 1.1 개별 명세서 목록

| 문서 ID | 명세서 | 핵심 역할 |
| :---: | :--- | :--- |
| EXT-MAP-001 | [카카오맵 위치서비스](./API_카카오맵_위치서비스_명세서.md) | 좌표·법정동 코드 획득 — **모든 연동의 시작점** |
| EXT-WEATHER-001 | [기상청 통합 연동](./API_기상청_통합_연동_명세서.md) | 실시간 예보 + 10년 ASOS 기후 통계 |
| EXT-SOIL-001 | [흙토람 토양정보](./API_흙토람_토양정보_명세서.md) | PNU 기반 토양 7종 화학 성분 분석 |
| EXT-FARM-001 | [농사로 재배기술](./API_농사로_재배기술_명세서.md) | HTML 재배 가이드 + 병해충 사진 DB |
| EXT-STAT-001 | [KOSIS 생산량통계](./API_KOSIS_생산량통계_명세서.md) | 10년 연도별·지역별 생산량 공식 통계 |

---

## 2. 통합 데이터 파이프라인

### 2.1 실시간 파이프라인 (유저 행동 트리거)

유저가 농장을 등록하거나 AI 추천을 요청하면, 다음 순서로 외부 API가 **연쇄 호출**된다.

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
          │  → (nx=63,ny=89)│  │  → PNU 19자리 조립      │
          │  → 실시간 예보   │  │  → 토양 7종 성분 조회   │
          └────────┬────────┘  └──────────┬─────────────┘
                   │                      │
                   │  기상 적합도 (12.5%)   │  토양 적합도 (12.5%)
                   │                      │
                   └──────────┬───────────┘
                              │
                              ▼
              ┌──────────────────────────────┐
              │  AI 추천 엔진 (FRM-002)       │
              │                              │
              │  환경 적합도 (25%)             │
              │  = 기상(12.5%) + 토양(12.5%)  │
              │                              │
              │  + 수급 적합도 (35%)           │
              │  + 수익성 (25%)               │
              │  + 농가 역량 (15%)            │
              │  = 종합 점수 (0~100)          │
              └──────────────────────────────┘
```

### 2.2 배치 파이프라인 (스케줄러 트리거)

사전에 대량 데이터를 DB에 적재해두고, 실시간 호출 시 참조하는 구조.

| 배치 | 스케줄 | 수집 대상 | 저장소 | 활용처 |
| :--- | :--- | :--- | :---: | :--- |
| `ClimateHistoryBatchJob` | 매일 03:00 | 기상청 ASOS 10년 기후 통계 | PostgreSQL | 기상 적합도 보정 (평년값) |
| `ProductionStatsBatchJob` | 매년 3월 1일 | KOSIS 10년 생산량 통계 | PostgreSQL | 수급 밸런스 기초 데이터 |
| `NongsaroPrefetchJob` | 주 1회 (월요일 06:00) | 농사로 주요 작물 TOP 20 가이드 | Redis + 로컬 스토리지 | 재배 가이드 사전 캐싱 |

---

## 3. AI 추천 점수와 외부 API 매핑

`수경02_기능명세서`의 FR-FM-002에 정의된 4개 추천 점수 항목이 각각 어떤 외부 API 데이터를 소비하는지 정리한다.

```
추천 점수 = (수급 적합도 × 0.35) + (환경 적합도 × 0.25) + (수익성 × 0.25) + (농가 역량 × 0.15)
```

| 점수 항목 (가중치) | 참조 외부 API | 참조 데이터 | ERD 테이블 |
| :--- | :--- | :--- | :--- |
| **수급 적합도** (35%) | KOSIS | 10년 생산량 추이 → 외부 공급 추정 | `balance_data.supply_ratio` |
| **환경 적합도** (25%) | 기상청 + 흙토람 | 기온·강수 + pH·유기물·인산 | `crops.climate_conditions` |
| **수익성** (25%) | KAMIS (※ 별도 명세) | 최근 3년 평균 시장 가격 | — |
| **농가 역량** (15%) | 내부 DB 전용 | 재배 이력, 보유 시설, 경작 면적 | `farms`, `crop_plans` |

> 📌 **KAMIS(농산물 유통정보)** API는 `지윤02_기능명세서` §8에 1시간 TTL로 언급되어 있으나, 별도 상세 명세서는 미작성 상태이다. 수익성 점수 산출에 핵심이므로 **추후 EXT-PRICE-001로 작성 필요**.

---

## 4. 환경변수 및 API Key 총괄

### 4.1 환경변수 목록

모든 키는 `.env` 파일에서 관리하며, 코드에 직접 기입을 **절대 금지**한다.

| 환경변수명 | API | 사용 위치 | 노출 |
| :--- | :--- | :---: | :---: |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 카카오맵 JS SDK | 프론트엔드 | ⚠️ 브라우저 (도메인 제한 보호) |
| `KAKAO_REST_API_KEY` | 카카오 REST API | 백엔드 Infra | ❌ 서버 전용 |
| `KMA_API_KEY` | 기상청 단기예보/ASOS | 백엔드 Infra | ❌ 서버 전용 |
| `SOIL_API_KEY` | 흙토람 토양정보 | 백엔드 Infra | ❌ 서버 전용 |
| `NONGSARO_API_KEY` | 농사로 재배기술 | 백엔드 Infra | ❌ 서버 전용 |
| `KOSIS_API_KEY` | KOSIS 생산량통계 | 백엔드 Infra | ❌ 서버 전용 |

### 4.2 호출 경로 원칙

```
┌─────────────────────────────────────────────────────────┐
│  카카오맵 JS SDK                                         │
│  (유일하게 브라우저 직접 로드 — 도메인 제한으로 보호)       │
│                                                         │
│  그 외 모든 REST API:                                    │
│  브라우저 → Next.js BFF API Route → Spring Boot Infra   │
│  (httpOnly 쿠키 ↔ JWT 변환)      (API Key 보관)          │
│                                                         │
│  → 외부 API 서버                                         │
│  (브라우저에서 REST Key 절대 노출 안 됨)                   │
└─────────────────────────────────────────────────────────┘
```

---

## 5. 캐싱 전략 총괄

| API | 캐시 대상 | 저장소 | TTL | 사유 |
| :--- | :--- | :---: | :---: | :--- |
| **카카오맵** | 주소→좌표 변환 | Redis | 7일 | 주소-좌표 매핑은 불변 |
| **카카오맵** | 키워드 검색 결과 | Redis | 1시간 | 가게 정보 변동 가능 |
| **기상청** | 단기예보 데이터 | Redis | 3시간 | 3시간 단위 발표 |
| **기상청** | ASOS 10년 통계 | PostgreSQL | 일일 배치 | 장기 보관용 이력 |
| **흙토람** | 토양 성분 데이터 | Redis | 24시간 | 토양 단기 불변 |
| **흙토람** | 주소→법정동 코드 | Redis | 7일 | 법정동 코드 고정 |
| **농사로** | 재배 가이드 HTML | Redis | 7일 | 내용 변동 적음 |
| **농사로** | 작물 이미지 | 로컬 스토리지 | 30일 | 공공기관 서버 지연 대비 |
| **KOSIS** | 10년 생산량 통계 | PostgreSQL | 연 1회 배치 | 연 1회만 발표 |

---

## 6. 에러 처리 통합 전략

### 6.1 공통 에러 래핑

모든 외부 API 호출은 `ExternalApiException`으로 래핑하여, 내부 도메인 서비스가 특정 API의 장애에 직접 영향받지 않도록 한다.

```java
// 헥사고날 Infra 계층 공통 예외
public class ExternalApiException extends RuntimeException {
    private final String apiName;      // "WEATHER", "SOIL", "KOSIS" 등
    private final String errorCode;    // "API_CONNECTION_FAIL"
    private final String correlationId; // X-Correlation-Id
}
```

### 6.2 API별 Fallback 체인

| 장애 API | 1차 Fallback | 2차 Fallback | 최종 Fallback |
| :--- | :--- | :--- | :--- |
| **기상청** | Redis 최종 캐시 | ASOS 평년 통계 (DB) | 기상 점수 50점 (중립) |
| **흙토람** | Redis 최종 캐시 | 읍면리 평균 토양 통계 | 토양 점수 50점 (중립) |
| **카카오맵** | Redis 최종 캐시 | 주소 직접 입력 폼 전환 | — |
| **농사로** | Redis 최종 캐시 | `crops` 테이블 기본 정보 | "가이드 일시 불가" 안내 |
| **KOSIS** | DB 이전 배치 데이터 | 전년도 값 + 추세 예측 | 수급 점수 미반영 안내 |

> 📌 **핵심 원칙:** 외부 API 1~2개가 다운되어도 **시스템 전체가 중단되지 않는다**.  
> 각 점수 항목에 중립값(50점)을 부여하고, 응답에 `"data_warning"` 플래그를 추가하여 유저에게 데이터 불완전성을 안내한다.

### 6.3 통합 Retry 정책

| 항목 | 기본값 |
| :--- | :--- |
| 최대 재시도 | 3회 |
| 대기 전략 | Exponential Backoff |
| 대기 시간 | 1초 → 2초 → 4초 |
| 요청 타임아웃 | 5초 (KOSIS만 10초) |
| Circuit Breaker | 5분 내 3회 연속 실패 시 30초간 차단 후 Half-Open |

---

## 7. 통합 패키지 구조

```
backend/src/main/java/com/farmbalance/infra/external/
│
├── common/
│   ├── ExternalApiException.java         # 공통 예외 클래스
│   ├── ExternalApiRetryPolicy.java       # 공통 Retry/CircuitBreaker 설정
│   └── ExternalApiCacheManager.java      # 공통 Redis 캐시 매니저
│
├── kakao/
│   ├── KakaoLocalClient.java             # REST: 주소/키워드/역지오코딩
│   └── KakaoResponseParser.java          # 좌표·법정동코드 추출
│
├── weather/
│   ├── WeatherApiClient.java             # 단기예보 호출
│   ├── AsosApiClient.java                # ASOS 과거 기후 호출
│   ├── GridCoordinateConverter.java      # 위경도 → 기상청 격자(nx,ny) 변환
│   └── ClimateHistoryBatchJob.java       # 10년 기후 통계 일일 배치
│
├── soil/
│   ├── SoilApiClient.java                # 흙토람 토양 성분 조회
│   ├── PnuCodeGenerator.java             # 법정동+번지 → PNU 21자리 조립
│   └── SoilStatusEvaluator.java          # NORMAL/LOW/HIGH 판정
│
├── nongsaro/
│   ├── NongsaroApiClient.java            # 2-Step (검색→상세) 호출
│   ├── NongsaroHtmlSanitizer.java        # Jsoup HTML 정제 (XSS 방어)
│   └── NongsaroImageResolver.java        # 이미지 URL 절대경로 변환
│
└── kosis/
    ├── KosisApiClient.java               # KOSIS 통계 데이터 호출
    ├── KosisCropCodeMapper.java          # crops ↔ KOSIS 코드 매핑
    ├── ProductionStatsBatchJob.java      # 연 1회 배치 수집
    └── TrendAnalyzer.java                # 10년 트렌드 판정
```

---

## 8. 구현 로드맵

| 단계 | 구현 대상 | 핵심 과제 | 선행 조건 |
| :---: | :--- | :--- | :--- |
| **Phase 1** | 카카오맵 + 기상청 | 좌표 획득 → 격자 변환 → 실시간 예보 | 카카오 앱 등록, 도메인 설정 |
| **Phase 2** | 흙토람 | PNU 조립 → 토양 성분 조회 → 판정 | Phase 1의 법정동 코드 |
| **Phase 3** | KOSIS 배치 | 10년 통계 적재 → `balance_data` 보정 | 작물-코드 매핑 테이블 |
| **Phase 4** | 농사로 | 2-Step 호출 → HTML 정제 → 가이드 UI | DOMPurify 프론트 설정 |
| **Phase 5** | AI 통합 | 환경 점수(기상+토양) + 수급 점수 합산 | Phase 1~3 완료 |
| **Phase 6** | 고도화 | Fallback 로직, 알림 결합, Circuit Breaker | 전체 API 안정화 후 |

---

## 9. ERD 변경 제안 종합

현재 ERD 대비 외부 API 연동을 위해 **검토가 필요한 변경 사항**들을 종합 정리한다.

| 대상 테이블 | 변경 내용 | 사유 | 명세서 출처 |
| :--- | :--- | :--- | :---: |
| `farms` | `lat` DECIMAL(10,7), `lng` DECIMAL(10,7) 추가 | 농장 좌표 저장 → 매번 재검색 방지 | EXT-MAP-001 |
| `crops` | `climate_conditions` JSONB에 `soil` 필드 추가 | 토양 적합도 매칭용 | EXT-SOIL-001 |
| `crops` | `kosis_org_id`, `kosis_tbl_id`, `kosis_obj_code` 추가 | KOSIS 통계코드 직접 매핑 | EXT-STAT-001 |
| 신규 | `climate_history` 테이블 | ASOS 10년 기후 통계 이력 저장 | EXT-WEATHER-001 |
| 신규 | `crop_production_stats` 테이블 | KOSIS 생산량 통계 이력 저장 | EXT-STAT-001 |

> ⚠️ 위 변경 사항은 팀 ERD 확정 회의에서 논의 후 반영한다.

---

## 10. 법적 준수 사항

모든 외부 공공데이터가 노출되는 화면에는 **출처 표기가 법적으로 필수**이다.

| 데이터 | 화면 하단 표기 문구 |
| :--- | :--- |
| 기상청 예보 데이터 | "출처: 기상청" |
| 흙토람 토양 데이터 | "출처: 농촌진흥청 흙토람" |
| 농사로 재배 정보 | "출처: 농촌진흥청 농사로" |
| KOSIS 통계 데이터 | "출처: 통계청 KOSIS" |
| 카카오맵 지도 | 카카오맵 SDK 자체 워터마크 표시 (자동) |

---

> 📌 **다음 단계:**  
> ① KAMIS(농산물 가격) API 명세서 작성 (EXT-PRICE-001) — 수익성 점수(25%) 핵심 데이터  
> ② ERD 변경 사항 팀 회의 상정  
> ③ Phase 1 구현 시작: 카카오맵 앱 등록 + `GridCoordinateConverter` 단위 테스트
