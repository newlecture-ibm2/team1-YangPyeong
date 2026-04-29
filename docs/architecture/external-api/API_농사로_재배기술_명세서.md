# 📖 농사로 재배 기술·병해충 정보 서비스 연동 기능명세서

> **문서 ID:** EXT-FARM-001  
> **작성일:** 2026-04-23  
> **최종 수정:** 2026-04-26 (cropEbook + dbyhsCccrrncInfo 2개 서비스 통합)  
> **버전:** v3.0  
> **관련 기능:** FRM-002 (AI 작물 추천), FRM-003 (재배 의향 등록/관리, 병해충 정보)  
> **관련 ERD:** `crop_guides`, `pest_occurrence_reports`

---

## 1. 개요

농촌진흥청 **농사로 API**는 2개의 서비스를 활용한다.

| # | 서비스명 | 설명 | 상태 |
|:---:|---|---|:---:|
| 1 | `cropEbook` | 작물별 재배 길잡이(PDF), 목차, 품종 정보 | ✅ 정상 |
| 2 | `dbyhsCccrrncInfo` | 병해충 발생정보 보고서(PDF) 연도별 조회·다운로드 | ✅ 정상 |

> ⚠️ 기존 `cntntsInfo` 서비스는 `resultCode: 13` (유효한 요청주소가 아닙니다) — **서비스 폐지**.

### 1.1 시스템 내 활용처

| 활용처 | 기능 ID | 구체적 활용 |
| :--- | :---: | :--- |
| **AI 추천 상세** | FRM-002 | 추천된 작물의 "재배 가이드 보기" → PDF URL 연결 |
| **농장 관리** | FRM-003 | 재배법 참조, 목차에서 해당 장 바로 링크 |
| **종자 등록** | FRM-003 | 품종 정보 → 품종 선택 참고자료 |

---

## 2. API 호출 프로세스 (계층 구조)

cropEbook은 **대분류 → 중분류 → 소분류(작물코드)** 계층 구조를 따른다.

```
Step 1. 대분류 목록 조회 (mainCategoryList)
        └── FC(식량작물), VC(채소), FT(과수), ...

Step 2. 중분류 목록 조회 (middleCategoryList)
        └── FC01(벼), VC01(엽경채류), VC04(조미채소), ...

Step 3. 소분류 목록 조회 (subCategoryList) → 작물코드 획득
        └── VC041201(양파), VC041301(마늘), ...

Step 4. 재배 길잡이 조회 (ebookList) → PDF URL, 표지 이미지
Step 5. 목차 조회 (cropIndexList) → 장/절 구조
Step 6. 품종 조회 (varietyList) → 품종명, 특성
```

---

## 3. API 호출 상세 (Request)

### 3.1 호출 정보

| 항목 | 내용 |
| :--- | :--- |
| **Base URL** | `http://api.nongsaro.go.kr/service/cropEbook/` |
| **Method** | `GET` |
| **제공처** | 농촌진흥청 농사로 |

### 3.2 공통 파라미터

| 변수명 | 필수 | 값(예시) | 설명 |
| :--- | :---: | :--- | :--- |
| `apiKey` | Y | `(발급키)` | 농사로 전용 인증키 |

### 3.3 주요 오퍼레이션

| # | 오퍼레이션 | 추가 파라미터 | 응답 핵심 필드 |
|:---:|---|---|---|
| 1 | `mainCategoryList` | — | `mainCategoryCode`, `mainCategoryName` |
| 2 | `middleCategoryList` | `mainCategoryCode` | `middleCategoryCode`, `middleCategoryName` |
| 3 | `subCategoryList` | `middleCategoryCode` | `subCategoryCode`, `subCategoryName` |
| 4 | `ebookList` | `subCategoryCode` | `ebookCode`, `ebookName`, `cropsEbookFile`(PDF URL), `ebookImg` |
| 5 | `cropIndexList` | `ebookCode` | `indexNumber`, `indexName`, `pageNumber` |
| 6 | `varietyList` | `subCategoryCode` | `varietyName`, `characteristic`, `imgUrl` |

---

## 4. 응답 데이터 및 DB 매핑

### 4.1 `crop_guides` 테이블 매핑

| DB 컬럼 | API 소스 | 설명 |
|---|---|---|
| `sub_category_code` | `subCategoryList.subCategoryCode` | 작물코드 (예: "VC041201") |
| `sub_category_nm` | `subCategoryList.subCategoryNm` | 작물명 (예: "양파") |
| `ebook_code` | `ebookList.ebookCode` | 길잡이 코드 |
| `ebook_name` | `ebookList.ebookName` | 길잡이명 |
| `ebook_pdf_url` | `ebookList.cropsEbookFile` | PDF URL |
| `ebook_img_url` | `ebookList.ebookImg` | 표지 이미지 |
| `index_data` | `cropIndexList` 전체 | JSONB로 저장 |
| `variety_count` | `varietyList` 건수 | 품종 수 |
| `variety_data` | `varietyList` 전체 | JSONB로 저장 |

### 4.2 작물별 농사로 API 호출 코드 (예시)

농사로는 `mainCategoryList` → `middleCategoryList` → `subCategoryList` 순으로 카테고리를 탐색하여 작물코드를 확인한다.

> [!WARNING]
> 아래 `subCategoryCode` 값은 **예시**입니다. 구현 시 농사로 API를 직접 호출하여 정확한 코드를 반드시 검증해야 합니다.

| 작물명 | subCategoryCode | middleCategoryCode | 설명 |
|---|---|---|---|
| 양파 | `VC041201` | `VC04` | 조미채소류 |
| 파 | `VC041202` | `VC04` | 조미채소류 |
| 마늘 | `VC041209` | `VC04` | 조미채소류 |
| 생강 | `VC041210` | `VC04` | 조미채소류 |

> 📌 이 매핑은 **애플리케이션 코드(Enum/Map)**로 관리한다. 별도 DB 테이블은 사용하지 않는다.

---

## 5. 예외 처리

| ErrorCode | 상황 | 대응 |
| :--- | :--- | :--- |
| `API_CONNECTION_FAIL` | 농사로 서버 무응답 | Retry 3회 → DB `crop_guides` 기존 데이터 사용 |
| `CONTENT_NOT_FOUND` | 해당 작물 ebook 없음 | `crops` 테이블 기본 정보만 표시 |
| `PDF_URL_INVALID` | PDF URL 404 | "재배 가이드를 불러올 수 없습니다" 안내 |

---

## 6. 보안 및 운영

| 항목 | 정책 |
| :--- | :--- |
| **API Key 관리** | `.env` (`NONGSARO_API_KEY`) |
| **호출 경로** | Next.js BFF → Spring Boot → 농사로 |
| **데이터 저장** | DB `crop_guides` 테이블에 영구 저장 |

---

## 7. 병해충발생정보 서비스 (`dbyhsCccrrncInfo`)

### 7.1 호출 정보

| 항목 | 내용 |
| :--- | :--- |
| **Base URL** | `http://api.nongsaro.go.kr/service/dbyhsCccrrncInfo/` |
| **Method** | `GET` |
| **오퍼레이션** | `dbyhsCccrrncInfoYear` (연도 콤보), `dbyhsCccrrncInfoList` (리스트) |

### 7.2 오퍼레이션 상세

#### 7.2.1 `dbyhsCccrrncInfoYear` — 연도 목록 조회

| 요청 변수 | 필수 | 설명 |
|---|:---:|---|
| `apiKey` | Y | 농사로 인증키 |

| 응답 변수 | 설명 |
|---|---|
| `yearCode` | 연도명 |
| `yearVal` | 연도값 |
| `yearCnt` | 해당 연도 건수 |

#### 7.2.2 `dbyhsCccrrncInfoList` — 병해충 발생정보 리스트

| 요청 변수 | 필수 | 설명 |
|---|:---:|---|
| `apiKey` | Y | 농사로 인증키 |
| `sText` | N | 검색어 |
| `sType` | N | 검색 조건 |
| `sYear` | N | 연도 필터 |

| 응답 변수 | 설명 |
|---|---|
| `cntntsNo` | 콘텐츠 번호 |
| `cntntsSj` | 제목 (예: "병해충발생정보 제 15호 (2024.12.1.~12.31.)") |
| `pblicteYear` | 연도 |
| `downFile` | **첨부파일(PDF) 다운로드 URL** |
| `rtnOrginlFileNm` | 원본 파일명 |
| `registDt` | 등록일 |
| `cntntsRdcnt` | 조회수 |

### 7.3 API 호출 흐름

```
Step 1. dbyhsCccrrncInfoYear → 연도 목록 (2009~2026, 총 249건)
Step 2. dbyhsCccrrncInfoList(sYear=2024) → 해당 연도 보고서 목록 (15건)
Step 3. downFile URL → PDF 다운로드
```

### 7.4 활용 방안

| 활용처 | 방식 |
|---|---|
| **Bedrock RAG 인제스트** | 최신 병해충 보고서 PDF → 벡터 DB 적재 → 챗봇 답변 소스 |
| **기상 연계 알림** | 장마·고온다습 감지 시 해당 시기 병해충 보고서 링크 안내 |
| **AI 추천 보조** | 추천 작물의 주요 병해충 발생 트렌드 분석 자료 |

### 7.5 `pest_occurrence_reports` 테이블 매핑

| DB 컨럼 | API 소스 | 설명 |
|---|---|---|
| `cntnts_no` | `dbyhsCccrrncInfoList.cntntsNo` | 콘텐츠 번호 (UNIQUE) |
| `title` | `dbyhsCccrrncInfoList.cntntsSj` | 보고서 제목 |
| `report_year` | `dbyhsCccrrncInfoList.pblicteYear` | 연도 |
| `pdf_url` | `dbyhsCccrrncInfoList.downFile` | PDF 다운로드 URL |
| `file_name` | `dbyhsCccrrncInfoList.rtnOrginlFileNm` | 원본 파일명 |
| `published_at` | `dbyhsCccrrncInfoList.registDt` | 등록일 |

---

## 8. 병해충 정보 활용 시나리오

### 8.1 데이터 소스

| 소스 | 서비스 | 활용 |
|---|---|---|
| **재배 길잡이 PDF** | `cropEbook` | PDF 내 병해충 관리 장(章) 참조 |
| **병해충 발생정보 보고서** | `dbyhsCccrrncInfo` | 월간 발생 현황 PDF 다운로드 |
| **Bedrock RAG** | — | 위 PDF들을 벡터 DB에 인제스트하여 챗봇 답변 소스로 활용 |

### 8.2 실무 시나리오

#### [CASE 1] 병해충 자가 진단

```
1. 농민 박씨 → 고추 잎에 갈색 반점 발견
2. 앱에서 사진 촬영 → Gemini AI Multimodal 진단 (FRM-003)
3. 결과: "탄저병 가능성 85%" + 방제법 3가지 제시
4. 확신도 낮을 경우:
   └── cropEbook 병해충 관리 장 PDF 링크
   └── dbyhsCccrrncInfo 해당 시기 발생정보 보고서
   └── Bedrock RAG 기반 추가 답변
5. 커뮤니티 Q&A에 이미지 첨부 질문 작성 가능
```

#### [CASE 2] 기상 + 병해충 발생정보 결합 알림

```
조건: 기상청 API(EXT-WEATHER-001)에서 장마 시작 감지
      + 유저가 '고추' 재배 중 (seed_registrations)

알림: "내일부터 장마가 시작됩니다. 고추 탄저병 예방을 위한
       방제 가이드를 확인하세요." [가이드 보기 →]
       → cropEbook: 병해충 관리 장
       → dbyhsCccrrncInfo: 해당 시기 병해충 발생정보 보고서
```

### 8.3 병해충 진단 Fallback 전략

| 장애 상황 | Fallback |
| :--- | :--- |
| Gemini AI 진단 실패 | cropEbook 병해충 장 PDF + 발생정보 보고서 PDF |
| PDF URL 404 | `crops` 테이블 기본 정보만 표시 |
| Bedrock RAG도 실패 | 커뮤니티 Q&A 작성 유도 |

> 기존 `cntntsInfo` 서비스의 병해충 이미지 DB는 서비스 폐지(`resultCode: 13`)로 **사용 불가**.  
> 대안: `dbyhsCccrrncInfo` 보고서 + Gemini AI Multimodal + Bedrock RAG 조합으로 대체.

