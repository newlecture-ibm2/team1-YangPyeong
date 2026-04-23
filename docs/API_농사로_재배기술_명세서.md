# 📖 농사로 재배 기술 및 병해충 정보 서비스 연동 기능명세서

> **문서 ID:** EXT-FARM-001  
> **작성일:** 2026-04-23  
> **버전:** v1.0  
> **관련 기능:** FRM-003 (재배 의향 등록/관리), FRM-002 (AI 작물 추천), COM-003 (알림)  
> **관련 ERD:** `crops.growth_days`, `crops.climate_conditions`, `crop_plans.status`

---

## 1. 개요

농촌진흥청 **농사로 API**는 다른 외부 API(기상청, 흙토람)와 달리 **수치 데이터가 아닌 방대한 텍스트(HTML)와 이미지**를 제공한다.  
따라서 데이터 '호출'보다 **'가공·렌더링'** 전략이 핵심이다.

### 1.1 시스템 내 활용처

| 활용처 | 기능 ID | 구체적 활용 |
| :--- | :---: | :--- |
| **디지털 재배 가이드** | FRM-003 | 유저가 등록한 작물의 단계별 재배력·시비·관수 전문 가이드 제공 |
| **병해충 자가진단** | FRM-003 | 작물 이상 증상 발견 시 고화질 병해충 사진과 방제법 대조 |
| **AI 추천 근거 보강** | FRM-002 | 추천된 작물의 재배 난이도·주의사항을 가이드로 즉시 연결 |
| **커뮤니티 지식 공유** | COM-QNA | Q&A 게시판에서 재배 정보 인용·링크 공유 |
| **알림 연동** | COM-003 | 파종 계획(`crop_plans.planting_date`) 시기에 맞춰 재배 가이드 푸시 |

### 1.2 다른 API와의 차별점

| 구분 | 기상청 / 흙토람 | 농사로 |
| :--- | :--- | :--- |
| **데이터 형태** | 정형 데이터 (숫자, 코드) | **비정형 데이터 (HTML 텍스트, 이미지)** |
| **호출 방식** | 1회 호출로 완결 | **2단계 호출 필수** (검색 → 상세) |
| **캐싱 주기** | 3h ~ 24h | **1주일** (내용 변동 거의 없음) |
| **프론트엔드 처리** | JSON 파싱 후 UI 컴포넌트 바인딩 | **HTML 렌더링 + XSS 보안 처리** |

---

## 2. API 호출 프로세스 (2-Step Flow)

농사로 API는 한 번의 호출로 상세 정보를 얻을 수 없다.  
반드시 **Step 1(검색) → Step 2(상세 조회)** 순서를 거쳐야 한다.

```
┌──────────────────────────────────────────────────────────────┐
│                    2-Step API Flow                            │
│                                                              │
│  [유저 검색: "고추"]                                          │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────────────────────────┐                         │
│  │  Step 1: 콘텐츠 목록 검색        │                         │
│  │  GET /cntntsList                │                         │
│  │  Input:  sText = "고추"         │                         │
│  │  Output: cntntsNo = [300127,    │                         │
│  │          300128, 300129, ...]    │                         │
│  └──────────────┬──────────────────┘                         │
│                 │  cntntsNo 전달                              │
│                 ▼                                            │
│  ┌─────────────────────────────────┐                         │
│  │  Step 2: 상세 콘텐츠 조회        │                         │
│  │  GET /cntntsDtl                 │                         │
│  │  Input:  cntntsNo = 300127      │                         │
│  │  Output: cn (HTML 본문)          │                         │
│  │          rtnImgSeCode (이미지)   │                         │
│  └─────────────────────────────────┘                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. API 호출 상세 (Request)

### 3.1 Step 1 — 콘텐츠 목록 검색

| 항목 | 내용 |
| :--- | :--- |
| **Endpoint** | `http://api.nongsaro.go.kr/service/cntntsInfo/cntntsList` |
| **Method** | `GET` |

| 변수명 | 필수 | 값(예시) | 설명 |
| :--- | :---: | :--- | :--- |
| `apiKey` | Y | `(발급키)` | **농사로 전용** 인증키 (공공데이터포털 키와 다를 수 있음) |
| `sText` | Y | `"고추"` | 작물명 또는 키워드 |
| `pageNo` | N | `1` | 페이지 번호 |
| `numOfRows` | N | `10` | 페이지당 결과 수 |

**응답 주요 필드:**

| 필드 | 타입 | 설명 |
| :--- | :---: | :--- |
| `cntntsNo` | String | 콘텐츠 고유 번호 → **Step 2에 전달** |
| `cntntsNm` | String | 콘텐츠 제목 (예: "고추의 주요 병해충 관리") |
| `cntntsSj` | String | 요약 설명 |

### 3.2 Step 2 — 상세 콘텐츠 조회

| 항목 | 내용 |
| :--- | :--- |
| **Endpoint** | `http://api.nongsaro.go.kr/service/cntntsInfo/cntntsDtl` |
| **Method** | `GET` |

| 변수명 | 필수 | 값(예시) | 설명 |
| :--- | :---: | :--- | :--- |
| `apiKey` | Y | `(발급키)` | 동일 인증키 |
| `cntntsNo` | Y | `300127` | Step 1에서 획득한 콘텐츠 번호 |

**응답 주요 필드:**

| 필드 | 타입 | 설명 | 주의사항 |
| :--- | :---: | :--- | :--- |
| `cn` | **String (HTML)** | 상세 재배법 본문 | ⚠️ `<br>`, `<div>`, `<table>` 등 **HTML 태그 포함** |
| `cntntsNm` | String | 콘텐츠 제목 | |
| `rtnImgSeCode` | String (URL) | 이미지 파일 경로 | ⚠️ 절대경로(`http://...`) 여부 확인 필요 |

---

## 4. 데이터 가공 전략

### 4.1 HTML 콘텐츠 렌더링 (Frontend)

**문제:** `cn` 필드의 데이터가 순수 텍스트가 아닌 **HTML 마크업 포함 문자열**이다.

```html
<!-- 농사로 응답 예시 (cn 필드) -->
<div class="cont_area">
  <h3>고추 탄저병</h3>
  <p>주로 <b>장마철</b>에 발생하며, 과실에 움푹 들어간 
  <span style="color:red">갈색 반점</span>이 나타납니다.</p>
  <br>
  <img src="http://api.nongsaro.go.kr/img/pest/pepper_001.jpg" />
</div>
```

**처리 방안:**

| 단계 | 처리 내용 | 기술 |
| :---: | :--- | :--- |
| 1 | 백엔드에서 HTML 수신 후 **위험 태그 제거** | `Jsoup` (Java HTML Parser) |
| 2 | 허용된 태그만 남겨 프론트엔드로 전달 | 화이트리스트: `p, br, b, h3, h4, img, table, tr, td, ul, li` |
| 3 | 프론트엔드에서 **sanitize 후 렌더링** | `DOMPurify` + `dangerouslySetInnerHTML` |
| 4 | 외부 HTML에 우리 디자인 시스템 적용 | CSS Module: `.nongsaro-content` 스코프 스타일 |

```tsx
// 프론트엔드 렌더링 예시 (Next.js)
import DOMPurify from 'dompurify';

function CultivationGuide({ htmlContent }: { htmlContent: string }) {
  const sanitized = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'h3', 'h4', 'img', 'table', 'tr', 'td', 'ul', 'li'],
    ALLOWED_ATTR: ['src', 'alt'],
  });
  
  return (
    <div
      className={styles.nongsaroContent}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
```

### 4.2 이미지 경로 처리

| 상황 | 처리 |
| :--- | :--- |
| 절대경로 (`http://api.nongsaro.go.kr/img/...`) | 그대로 `<img src=...>`에 사용 |
| 상대경로 (`/img/pest/...`) | 백엔드에서 Base URL 붙여서 절대경로로 변환 |
| 이미지 로딩 실패 | 기본 플레이스홀더 이미지로 대체 (`onerror` 핸들링) |

---

## 5. ERD 연동 상세

### 5.1 `crops` 테이블 — 작물별 가이드 자동 연결

유저가 종자를 등록(`seed_registrations`)하면, 해당 작물의 `crops.code`를 기반으로 농사로 API를 **자동 호출**하여 재배 가이드를 미리 확보한다.

```
유저가 '고추' 종자 등록 (FRM-003)
    │
    ▼
crops 테이블에서 code = 'PEPPER_001', name = '고추' 조회
    │
    ▼
농사로 API Step 1: sText = '고추' → cntntsNo 획득
    │
    ▼
농사로 API Step 2: cntntsNo → 상세 재배 가이드(HTML) + 이미지 획득
    │
    ▼
Redis 캐시 저장 (Key: guide:PEPPER_001, TTL: 7일)
    │
    ▼
유저 대시보드에 '재배 가이드 보기' 버튼 활성화
```

### 5.2 `crop_plans` 테이블 — 파종 시기별 가이드 푸시

| 시점 | crop_plans.status | 알림 내용 (COM-003) | 가이드 연결 |
| :--- | :---: | :--- | :--- |
| 파종 7일 전 | `PLANNED` | "고추 파종 준비 가이드를 확인하세요" | 농사로: 고추 재배법 |
| 파종 당일 | `IN_PROGRESS` | "오늘 파종일입니다! 주의사항을 확인하세요" | 농사로: 파종 시 주의사항 |
| 파종 30일 후 | `IN_PROGRESS` | "고추 정식 후 첫 번째 추비 시기입니다" | 농사로: 시비 가이드 |
| 병해충 주의 시기 | `IN_PROGRESS` | "장마철 고추 탄저병에 주의하세요" | 농사로: 병해충 관리 |

---

## 6. 실무 활용 시나리오

### 6.1 [CASE 1] 재배 가이드 자동 제공

```
1. 농민 김씨 → 종자 등록: '딸기' (STRAWBERRY_001)
2. 시스템 → 농사로 API 자동 호출 → 딸기 재배력 확보
3. 대시보드 → "딸기 재배 가이드" 카드 표시
4. 클릭 → 단계별 재배법 (HTML 렌더링) + 이미지 표시
```

### 6.2 [CASE 2] 병해충 자가 진단

```
1. 농민 박씨 → 고추 잎에 갈색 반점 발견
2. 앱 검색창 → "고추 병해충" 검색
3. Step 1 → 관련 콘텐츠 목록 표시:
   ├── "고추 탄저병 증상과 방제"
   ├── "고추 역병의 원인과 대책"
   └── "고추 바이러스병 진단법"
4. 농민이 "탄저병" 선택 → Step 2 → 상세 사진 + 방제법 표시
5. 사진 대조 후 → 커뮤니티 Q&A에 질문 작성 (이미지 참조 첨부)
```

### 6.3 [CASE 3] 기상 + 재배 가이드 결합 알림

```
조건: 기상청 API(EXT-WEATHER-001)에서 내일 '장마 시작' 감지
      + 유저의 crop_plans에 '고추' 재배 중

알림: "내일부터 장마가 시작됩니다. 고추 탄저병 예방을 위한 
       방제 가이드를 확인하세요." [가이드 보기 →]
```

---

## 7. 시스템 아키텍처

### 7.1 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Spring Boot (Infra 계층)                      │
│                                                                     │
│  ┌───────────────────────────┐                                      │
│  │  NongsaroApiClient        │                                      │
│  │                           │                                      │
│  │  Step 1: cntntsList       │                                      │
│  │  Step 2: cntntsDtl        │                                      │
│  │                           │                                      │
│  │  응답 수신 후:             │                                      │
│  │  - Jsoup으로 HTML 정제    │                                      │
│  │  - 이미지 URL 절대경로 보정│                                      │
│  └──────────┬────────────────┘                                      │
│             │                                                       │
│             ├──→ Redis 캐시 저장                                     │
│             │    Key: guide:{crop_code}                              │
│             │    TTL: 7일 (168h)                                     │
│             │                                                       │
│             ├──→ 알림 서비스 (crop_plans 기반 푸시)                    │
│             │                                                       │
│             └──→ BFF → 프론트엔드                                    │
│                       │                                             │
│                       ▼                                             │
│              DOMPurify sanitize → dangerouslySetInnerHTML            │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 캐싱 전략

| 대상 | 저장소 | TTL | 사유 |
| :--- | :---: | :---: | :--- |
| Step 1 검색 결과 (cntntsNo 목록) | **Redis** | 7일 | 콘텐츠 목록은 거의 변하지 않음 |
| Step 2 상세 콘텐츠 (HTML + 이미지 URL) | **Redis** | 7일 | 재배법 내용 변동 매우 적음 |
| 자주 조회되는 작물 TOP 20 이미지 | **서버 로컬 스토리지** | 30일 | 공공기관 서버 이미지 로딩 지연 대비 |

> 📌 **캐시 키 설계:** `guide:{crop_code}:{cntntsNo}` (예: `guide:PEPPER_001:300127`)

---

## 8. 예외 처리

### 8.1 에러 코드

| ErrorCode | HTTP | 상황 | 대응 |
| :--- | :---: | :--- | :--- |
| `API_CONNECTION_FAIL` | 502 | 농사로 서버 무응답 | Retry 3회 → 캐시 Fallback |
| `CONTENT_NOT_FOUND` | 200 | sText 검색 결과 0건 | "해당 작물 정보를 찾을 수 없습니다" + crops 테이블 기본 정보 표시 |
| `HTML_PARSE_ERROR` | 200 | cn 필드 HTML 형식 손상 | 태그 제거(Strip Tags) 후 순수 텍스트만 제공 |
| `IMAGE_LOAD_FAIL` | — | 이미지 URL 404 | 플레이스홀더 이미지 + "이미지를 불러올 수 없습니다" |

### 8.2 Fallback 전략

| 장애 상황 | Fallback |
| :--- | :--- |
| 농사로 API 장애 | Redis 최종 캐시 반환 |
| 캐시도 없는 상태 | `crops` 테이블의 기본 정보(`growth_days`, `climate_conditions`)만 표시 |
| HTML 렌더링 실패 | 태그 전체 제거 → 순수 텍스트로 표시 |
| 이미지 서버 지연 | `loading="lazy"` 속성 + 스켈레톤 UI 노출 |

### 8.3 Retry 정책

```
최대 재시도: 3회
대기 전략: Exponential Backoff (1초 → 2초 → 4초)
타임아웃: 요청당 5초
```

---

## 9. 보안 및 운영

| 항목 | 정책 |
| :--- | :--- |
| **API Key 관리** | `.env` 파일 관리. 농사로 키는 기상청·카카오와 **별도 변수**로 분리 (`NONGSARO_API_KEY`) |
| **XSS 방어** | 백엔드 `Jsoup` 화이트리스트 + 프론트엔드 `DOMPurify` **이중 방어** |
| **호출 경로** | Next.js BFF → Spring Boot → 농사로. REST Key 서버 전용 |
| **로그 추적** | `X-Correlation-Id` 부여, Step 1/Step 2 각각의 응답 시간 로깅 |

---

## 10. 구현 패키지 구조

```
backend/src/main/java/com/farmbalance/infra/external/nongsaro/
├── NongsaroApiClient.java           # 농사로 API 2-Step 호출 클라이언트
├── NongsaroHtmlSanitizer.java       # Jsoup 기반 HTML 정제 (화이트리스트 필터)
├── NongsaroImageResolver.java       # 이미지 URL 절대경로 변환 + 캐싱
└── dto/
    ├── ContentListResponseDto.java  # Step 1 검색 결과 DTO
    └── ContentDetailResponseDto.java# Step 2 상세 콘텐츠 DTO

frontend/src/components/guide/
├── CultivationGuide.tsx             # HTML 재배 가이드 렌더링 컴포넌트
├── PestDiagnosis.tsx                # 병해충 사진 대조 컴포넌트
└── GuideSearchBar.tsx               # 농사로 검색 UI
```

---

> 📌 **다음 단계:**  
> ① `crops` 테이블 초기 데이터(작물 20종)에 대해 농사로 cntntsNo 매핑 테이블 구축  
> ② `NongsaroHtmlSanitizer` 화이트리스트 태그 목록 확정  
> ③ 자주 조회되는 작물 TOP 20 이미지 사전 캐싱 스크립트 작성
