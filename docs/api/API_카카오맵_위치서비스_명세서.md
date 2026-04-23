# 🗺️ 카카오맵 위치 기반 서비스 연동 기능명세서

> **문서 ID:** EXT-MAP-001  
> **작성일:** 2026-04-23  
> **버전:** v1.0  
> **관련 기능:** FRM-001 (농장 등록/관리), Common (주소 변환), ADM-001 (관제 대시보드)  
> **관련 ERD:** `farms.address`, `stores.lat/lng/partner_status`  
> **연계 명세서:** EXT-WEATHER-001 (기상청), EXT-SOIL-001 (흙토람)

---

## 1. 개요

카카오맵 API는 FarmBalance 시스템의 **모든 외부 데이터 연동의 시작점**이다.  
유저가 지도에서 농장 위치를 지정하면, 그 좌표와 주소 정보가 기상청·흙토람·AI 추천 엔진으로 전파된다.

### 1.1 시스템 내 활용처

| 활용처 | 기능 ID | 사용하는 API 유형 | 구체적 활용 |
| :--- | :---: | :---: | :--- |
| **농장 위치 시각화** | FRM-001 | JS SDK | 농장 위치 마커 표시, 필지 폴리곤 렌더링 |
| **주소 → 좌표 변환** | Common | REST API | 기상청 격자(nx,ny) 변환의 원천 좌표 생성 |
| **주소 → 법정동 코드** | Common | REST API | 흙토람 PNU 코드 조립용 법정동코드·번지 획득 |
| **주변 시설 검색** | Common | REST API | 농기구 수리점, 종묘사, 농업기술센터 등 검색 |
| **관제 히트맵** | ADM-001 | JS SDK | 전국 파종 현황 히트맵 시각화 (관리자 대시보드) |

### 1.2 외부 API간 데이터 연결 구조

```
                    ┌──────────────────────────────────────────────┐
                    │              카카오맵 API (EXT-MAP-001)       │
                    │                                              │
                    │  Input:  유저 주소 텍스트 or 지도 클릭         │
                    │  Output: 위경도(x, y) + 법정동코드 + 번지     │
                    │                                              │
                    └──────────┬──────────────────┬────────────────┘
                               │                  │
                   ┌───────────▼──────┐   ┌───────▼─────────────┐
                   │  기상청 API       │   │  흙토람 API          │
                   │  (EXT-WEATHER)   │   │  (EXT-SOIL)         │
                   │                  │   │                     │
                   │  (x,y) → (nx,ny)│   │  법정동+번지 → PNU  │
                   │  → 실시간 예보   │   │  → 토양 성분 분석    │
                   └────────┬─────────┘   └──────────┬──────────┘
                            │                        │
                            └───────────┬────────────┘
                                        ▼
                           ┌────────────────────────┐
                           │   AI 추천 엔진 (FRM-002) │
                           │                        │
                           │  기상 적합도 (12.5%)    │
                           │  토양 적합도 (12.5%)    │
                           │  = 환경 점수 (25%)      │
                           └────────────────────────┘
```

---

## 2. API 키 체계 및 사용 구분

카카오맵은 용도에 따라 **서로 다른 키**를 사용한다. 혼용 시 인증 에러가 발생하므로 반드시 구분해야 한다.

| 키 종류 | 사용 위치 | 용도 | 환경변수명 |
| :--- | :---: | :--- | :--- |
| **JavaScript Key** | 프론트엔드 (브라우저) | 지도 SDK 로드, 마커·폴리곤 렌더링 | `NEXT_PUBLIC_KAKAO_MAP_KEY` |
| **REST API Key** | 백엔드 (Spring Boot) | 주소 검색, 좌표 변환, 키워드 검색 | `KAKAO_REST_API_KEY` |

> ⚠️ **JavaScript Key**는 브라우저에 노출될 수밖에 없으므로, 반드시 카카오 Developers에서 **도메인 제한**을 설정해야 한다 (§7.1 참고).

---

## 3. [Frontend] Maps JavaScript SDK

### 3.1 로드 방식 (Next.js 15)

```tsx
// app/layout.tsx 또는 지도 사용 페이지
import Script from 'next/script';

<Script
  src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services,clusterer`}
  strategy="afterInteractive"
/>
```

| 옵션 | 값 | 설명 |
| :--- | :--- | :--- |
| `strategy` | `afterInteractive` | 페이지 로드 후 SDK 로드 → LCP 성능 보호 |
| `libraries` | `services,clusterer` | `services`: 주소 검색. `clusterer`: 마커 클러스터링 (관제 히트맵용) |

### 3.2 주요 사용 화면

| 화면 | 기능 | SDK 기능 |
| :--- | :--- | :--- |
| 농장 등록 (FRM-001) | 지도 클릭으로 농장 위치 핀 지정 | `kakao.maps.event.addListener(map, 'click')` |
| 대시보드 (FRM-001) | 내 농장 위치 마커 표시 | `kakao.maps.Marker`, `kakao.maps.InfoWindow` |
| 주변 시설 (Common) | 주변 농기구점·종묘사 마커 표시 | `kakao.maps.Marker` + DB `stores` 데이터 |
| 관리자 관제 (ADM-001) | 전국 파종 현황 히트맵 | `kakao.maps.MarkerClusterer` |

---

## 4. [Backend] REST API 상세

**Base URL:** `https://dapi.kakao.com`  
**인증 헤더:** `Authorization: KakaoAK {REST_API_KEY}`

### 4.1 주소 검색 (Address Search)

농장 등록 시 유저가 입력한 주소로부터 좌표와 법정동 코드를 획득하는 **핵심 API**.

| 항목 | 내용 |
| :--- | :--- |
| **Endpoint** | `GET /v2/local/search/address.json` |
| **필수 파라미터** | `query` = 주소 텍스트 |

**응답 중 사용 필드:**

| 필드 | 설명 | 연계 대상 |
| :--- | :--- | :--- |
| `address.x` | 경도 (longitude) | → 기상청 격자 변환 (`nx`) |
| `address.y` | 위도 (latitude) | → 기상청 격자 변환 (`ny`) |
| `address.b_code` | 법정동 코드 (10자리) | → 흙토람 PNU 조립 |
| `address.main_address_no` | 본번 | → PNU 본번 (4자리 패딩) |
| `address.sub_address_no` | 부번 | → PNU 부번 (4자리 패딩) |
| `address.mountain_yn` | 산 여부 (Y/N) | → PNU 산 구분코드 |

### 4.2 키워드 검색 (Keyword Search)

유저의 농장 좌표를 중심으로 반경 내 편의시설을 검색한다.

| 항목 | 내용 |
| :--- | :--- |
| **Endpoint** | `GET /v2/local/search/keyword.json` |
| **필수 파라미터** | `query`, `x`, `y` |
| **선택 파라미터** | `radius` (기본 5,000m), `category_group_code` |

**검색 키워드 프리셋:**

| 프리셋 이름 | 검색 키워드 | 대상 |
| :--- | :--- | :--- |
| 종묘·씨앗 | `"종묘상"`, `"씨앗가게"` | 근처 종자 구매처 |
| 농기구 수리 | `"농기계"`, `"농기구수리"` | 장비 수리점 |
| 농업기술센터 | `"농업기술센터"` | 지자체 기관 |

**`stores` 테이블과의 매칭 로직:**

```
1. 카카오 키워드 검색 결과 획득 (외부 데이터)
2. DB stores 테이블에서 반경 내 is_active=true 가게 조회 (내부 데이터)
3. 두 결과를 병합하여 지도에 표시
   ├── DB 제휴 가게 (partner_status='PARTNER') → ⭐ 특수 마커 (우선 노출)
   ├── DB 일반 가게 (partner_status='NONE')    → 📌 일반 마커
   └── 카카오 검색 전용 결과 (DB 미등록)       → 📍 외부 마커 (별도 색상)
```

### 4.3 좌표 → 주소 변환 (Reverse Geocoding)

| 항목 | 내용 |
| :--- | :--- |
| **Endpoint** | `GET /v2/local/geo/coord2address.json` |
| **필수 파라미터** | `x` (경도), `y` (위도) |
| **용도** | 지도 클릭 시 좌표로부터 지번 주소 역산 → `farms.address`에 자동 입력 |

---

## 5. ERD 연동 상세

### 5.1 `farms` 테이블 연동

유저가 농장을 등록할 때, 카카오맵 API가 자동으로 채워주는 필드:

| ERD 컬럼 | 데이터 원천 | 설명 |
| :--- | :--- | :--- |
| `farms.address` | 주소 검색 or 역지오코딩 | 유저가 지도 클릭 또는 주소 입력 시 자동 저장 |

> 📌 현재 ERD에 `farms.lat`, `farms.lng` 컬럼이 없다. 농장 위치를 지도에 마커로 표시하려면 **위경도 컬럼 추가를 검토**해야 한다.

### 5.2 `stores` 테이블 연동

| ERD 컬럼 | 카카오맵 활용 | 설명 |
| :--- | :--- | :--- |
| `stores.lat` / `stores.lng` | 마커 좌표 | 가게의 지도 위 위치 표시 |
| `stores.partner_status` | 마커 아이콘 분기 | `PARTNER` → 특수 마커 |
| `stores.category` | 검색 키워드 매칭 | 업종별 필터링 |
| `stores.is_active` | 노출 여부 | `false`인 가게는 지도에서 제외 |

---

## 6. 시스템 아키텍처

### 6.1 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend (Next.js 15)                      │
│                                                                     │
│  ┌─────────────────────┐     ┌────────────────────────────────┐    │
│  │  Kakao Maps JS SDK  │     │  지도 컴포넌트                   │    │
│  │  (NEXT_PUBLIC key)  │────→│  - 농장 마커 표시                │    │
│  │                     │     │  - 클릭 이벤트 → 좌표 획득       │    │
│  │                     │     │  - 주변 시설 마커 렌더링          │    │
│  └─────────────────────┘     └─────────────┬──────────────────┘    │
│                                            │ 좌표/주소               │
│                              ┌─────────────▼──────────────────┐    │
│                              │  BFF API Route                  │    │
│                              │  /api/bff/[...path]             │    │
│                              │  (httpOnly 쿠키 ↔ JWT 변환)     │    │
│                              └─────────────┬──────────────────┘    │
└────────────────────────────────────────────┼────────────────────────┘
                                             │
┌────────────────────────────────────────────▼────────────────────────┐
│                        Spring Boot (Infra 계층)                      │
│                                                                     │
│  ┌───────────────────────┐                                          │
│  │  KakaoLocalClient     │                                          │
│  │  (REST_API_KEY)       │                                          │
│  │                       │                                          │
│  │  - 주소 검색          │                                          │
│  │  - 역지오코딩         │                                          │
│  │  - 키워드 검색        │                                          │
│  └───────┬───────────────┘                                          │
│          │                                                          │
│          ├──→ Redis 캐시 저장 (주소↔좌표: TTL 7d)                    │
│          │                                                          │
│          ├──→ GridCoordinateConverter (좌표 → 기상청 nx, ny)         │
│          │                                                          │
│          └──→ PnuCodeGenerator (법정동+번지 → PNU 21자리)            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 캐싱 전략

| 대상 | 저장소 | TTL | 사유 |
| :--- | :---: | :---: | :--- |
| 주소 → 좌표(x,y) 변환 | **Redis** | 7일 | 주소-좌표 매핑은 거의 불변 |
| 주소 → 법정동코드 변환 | **Redis** | 7일 | 법정동 코드는 고정값 |
| 키워드 검색 결과 | **Redis** | 1시간 | 가게 정보는 변동 가능성 있음 |
| stores 테이블 공간 쿼리 | **No Cache** | — | DB 실시간 조회 (데이터 정합성 우선) |

---

## 7. 보안 및 운영

### 7.1 플랫폼 도메인 등록 (필수)

카카오 Developers 콘솔에서 **Web 플랫폼 도메인**을 등록해야 JS SDK가 정상 작동한다.

| 환경 | 등록할 도메인 | 비고 |
| :--- | :--- | :--- |
| **로컬 개발** | `http://localhost:3000` | 모든 팀원 개발 환경 |
| **Docker 개발** | `http://localhost:3000` | Docker Compose 환경 동일 |
| **운영 서버** | `https://farmbalance.com` (예정) | 배포 전 반드시 등록 |

> ⚠️ **도메인 미등록 시 증상:** 브라우저에서 지도 SDK 로드 시 `401 Unauthorized` 에러 발생.  
> 팀원이 이 에러를 만나면 **콘솔 도메인 등록 여부를 먼저 확인**할 것.

### 7.2 API Key 관리

| 키 | 저장 위치 | 노출 여부 |
| :--- | :--- | :--- |
| JavaScript Key | `frontend/.env.local` → `NEXT_PUBLIC_KAKAO_MAP_KEY` | 브라우저 노출됨 (도메인 제한으로 보호) |
| REST API Key | `backend/.env` → `KAKAO_REST_API_KEY` | 서버 전용 (절대 노출 금지) |

### 7.3 호출 경로 원칙

| 호출 유형 | 경로 | 사유 |
| :--- | :--- | :--- |
| 지도 렌더링 (JS SDK) | 브라우저 → 카카오 CDN 직접 | SDK 특성상 직접 로드 필수 |
| 주소 검색 (REST API) | Next.js BFF → Spring Boot → 카카오 | REST Key 보호, 결과 캐싱 |
| 키워드 검색 (REST API) | Next.js BFF → Spring Boot → 카카오 | REST Key 보호 |

---

## 8. 예외 처리

### 8.1 에러 코드

| ErrorCode | HTTP | 상황 | 대응 |
| :--- | :---: | :--- | :--- |
| `API_CONNECTION_FAIL` | 502 | 카카오 API 서버 무응답 | Retry 3회 → Fallback |
| `MAP_LOAD_FAIL` | — | JS SDK 로드 실패 (네트워크) | 정적 지도 이미지로 대체 |
| `ADDRESS_NOT_FOUND` | 200 | 검색 결과 0건 | "정확한 지번 주소를 입력해 주세요" + 지도 클릭 안내 |
| `DOMAIN_NOT_REGISTERED` | 401 | 플랫폼 도메인 미등록 | 개발자에게 카카오 콘솔 도메인 설정 안내 |

### 8.2 Fallback 전략

| 장애 상황 | Fallback |
| :--- | :--- |
| JS SDK 로드 실패 | 주소 텍스트 입력 폼으로 전환 (지도 없이 주소 검색만 수행) |
| REST API 장애 | Redis 최종 캐시 반환 |
| 카카오 전체 장애 | DB `stores` 테이블의 기존 좌표 기반으로 정적 목록 표시 |
| 키워드 검색 0건 | DB `stores` 테이블에서 반경 검색만 수행 |

### 8.3 Retry 정책 (REST API)

```
최대 재시도: 3회
대기 전략: Exponential Backoff (1초 → 2초 → 4초)
타임아웃: 요청당 3초
```

---

## 9. 구현 패키지 구조

```
backend/src/main/java/com/farmbalance/infra/external/kakao/
├── KakaoLocalClient.java            # REST API 호출 클라이언트 (주소/키워드/역지오코딩)
├── KakaoResponseParser.java         # 응답에서 좌표·법정동코드·번지 추출 파서
└── dto/
    ├── AddressSearchResponseDto.java # 주소 검색 응답 DTO
    └── KeywordSearchResponseDto.java # 키워드 검색 응답 DTO

frontend/src/components/map/
├── KakaoMap.tsx                      # 지도 렌더링 컴포넌트 (SDK 래퍼)
├── FarmMarker.tsx                    # 농장 위치 마커 컴포넌트
├── StoreMarker.tsx                   # 주변 시설 마커 컴포넌트 (제휴 구분 아이콘)
└── MapSearchBar.tsx                  # 지도 내 주소·키워드 검색 UI
```

---

## 10. ERD 변경 제안

> ⚠️ 현재 `farms` 테이블에 위경도 컬럼이 없어, 농장 위치를 지도에 표시하려면 매번 주소로 재검색해야 한다.

| 대상 테이블 | 추가 컬럼 | 타입 | 사유 |
| :--- | :--- | :--- | :--- |
| `farms` | `lat` | DECIMAL(10,7) | 농장 위도 저장 → 지도 마커 즉시 표시 |
| `farms` | `lng` | DECIMAL(10,7) | 농장 경도 저장 → 기상청 API 호출 시 재변환 불필요 |

이 변경은 팀 내 ERD 확정 시 논의 필요.

---

> 📌 **다음 단계:**  
> ① 카카오 Developers 앱 생성 및 JS Key / REST Key 발급  
> ② 로컬 개발 도메인(`localhost:3000`) 등록  
> ③ `KakaoMap.tsx` 컴포넌트 프로토타입 구현  
> ④ `farms` 테이블 위경도 컬럼 추가 여부 팀 논의
