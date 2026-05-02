# 📖 농사로 Open API 전체 서비스 연동 명세서

> **문서 ID:** EXT-FARM-002  
> **작성일:** 2026-04-30  
> **인증키 환경변수:** `NONGSARO_API_KEY`  
> **응답 형식:** XML (CDATA 포함)  
> **공통 파라미터:** `apiKey` (필수)

---

## 목차

| # | 서비스명 | 서비스 코드 | 상태 | 데이터 건수 |
|:-:|--------|---------|:----:|:-------:|
| 1 | [첨단농업기술](#1-첨단농업기술-uptodefarmngTchnlgyInfo) | `uptodeFarmngTchnlgyInfo` | ✅ 정상 | 171건 |
| 2 | [원클릭 농업기술](#2-원클릭-농업기술-oneclickfarmngTchnlgy) | `oneClickFarmngTchnlgy` | ✅ 정상 | 확인 필요 |
| 3 | [병해충발생정보](#3-병해충발생정보-dbyhscccrrncinfo) | `dbyhsCccrrncInfo` | ✅ 정상 | 249건 |
| 4 | [품종 정보](#4-품종-정보-varietyinfo) | `varietyInfo` | ✅ 정상 | 2,604건 |
| 5 | 작목별농업기술정보 | `cropEbook` | ✅ 정상 (현석님 키) | 11개 대분류 |
| 6 | [농작물재해예방정보](#5-농작물재해예방정보-frcdsstrprevnt) | `frcDsstrPrevnt` | ✅ 정상 | 320건 |
| 7 | [농작업일정 정보](#6-농작업일정-정보-farmworkingplannew) | `farmWorkingPlanNew` | ✅ 정상 | 10개 품목 |
| 8 | [친환경농업 우수사례](#7-친환경농업-우수사례-evrfrndfarmng) | `evrfrndFarmng` | ✅ 정상 | 66건 |
| 9 | [품목별 관리매뉴얼](#8-품목별-관리매뉴얼-farmworkingplan) | `farmWorkingPlan` | ✅ 정상 | 10개 품목 |

---

## 1. 첨단농업기술 (`uptodeFarmngTchnlgyInfo`)

### 1.1 서비스 개요

| 항목 | 내용 |
|------|------|
| **Base URL** | `http://api.nongsaro.go.kr/service/uptodeFarmngTchnlgyInfo/` |
| **Method** | `GET` |
| **총 데이터** | 171건 (9개 분류) |
| **활용처** | AI 추천 보조 자료, 재배 기술 참조, RAG 인제스트 소스 |

### 1.2 오퍼레이션

| # | 오퍼레이션 | 설명 | 목록 | 페이징 |
|:-:|---------|------|:----:|:-----:|
| 1 | `uptodeFarmngTchnlgyInfoClassCode` | 분류코드 목록 | ○ | — |
| 2 | `uptodeFarmngTchnlgyInfoLst` | 기술 목록 | ○ | ○ |
| 3 | `uptodeFarmngTchnlgyInfoDtl` | 기술 상세 | — | — |

### 1.3 분류코드 (`uptodeFarmngTchnlgyInfoClassCode`)

**요청:** `apiKey`만 필수

**응답 (실제 데이터):**

| 코드 | 분류명 |
|------|--------|
| `A010901` | 농기계 |
| `A010902` | 농업환경 |
| `A010903` | 생명·유전 |
| `A010904` | 원예 |
| `A010905` | 농산물안전성 |
| `A010906` | 작물 |
| `A010907` | 잠사곤충 |
| `A010908` | 축산 |
| `A010909` | 특용작물 |

### 1.4 목록 조회 (`uptodeFarmngTchnlgyInfoLst`)

**요청 파라미터:**

| 파라미터 | 필수 | 설명 |
|---------|:----:|------|
| `apiKey` | ○ | 인증키 |
| `classCode` | — | 분류코드 (예: `A010904`) |
| `sType` | — | 검색 종류 |
| `sText` | — | 검색어 |
| `pageNo` | — | 페이지 번호 |
| `numOfRows` | — | 한 페이지 건수 |

**응답 필드 → JSON 매핑:**

| XML 필드 | JSON 키 | 설명 |
|---------|-----------|------|
| `classSubIdx` | `id` | 콘텐츠 번호 (PK) |
| `classCode` | `categoryCode` | 분류코드 |
| `className` | `categoryName` | 분류코드명 |
| `classSubCode` | `subCode` | 서브코드 |
| `classSubTitle` | `title` | 제목 |
| `classSubContents` | `summary` | 개요 |
| `classSubContents2` | `content` | 상세 내용 |
| `classSubHtml` | `htmlFile` | HTML 파일명 |
| `classSubPdf` | `pdfFile` | PDF 파일명 |
| `classSubMaster` | `contact` | 담당자 정보 |
| `classSubMovieUrl` | `videoUrl` | 관련 동영상 URL |
| `classSubUse` | `isActive` | 사용여부 (`Y`/`N`) |
| `regDate` | `registeredAt` | 등록일 |

### 1.5 상세 조회 (`uptodeFarmngTchnlgyInfoDtl`)

**요청:** `apiKey` + `classSubIdx` (콘텐츠 번호)

**응답:** 목록과 동일한 필드, 단건 반환

### 1.6 실제 응답 예시 (XML → JSON 변환)

**원본 XML:**
```xml
<item>
  <classSubIdx><![CDATA[198]]></classSubIdx>
  <classCode><![CDATA[A010902]]></classCode>
  <className><![CDATA[농업환경]]></className>
  <classSubCode><![CDATA[A01090201]]></classSubCode>
  <classSubTitle><![CDATA[과학영농 실천을 위한 토양정보시스템 흙토람]]></classSubTitle>
  <classSubContents><![CDATA[농사를 짓고자 할 때 토양특성에 맞는 작물을 제시...]]></classSubContents>
  <classSubPdf><![CDATA[A01090201.pdf]]></classSubPdf>
  <classSubMaster><![CDATA[담당자 : 농업연구사 최은영 031-290-0346]]></classSubMaster>
  <classSubUse><![CDATA[Y]]></classSubUse>
  <regDate><![CDATA[2009-06-12 15:01:19.0]]></regDate>
</item>
```

**변환 JSON:**
```json
{
  "id": 198,
  "categoryCode": "A010902",
  "categoryName": "농업환경",
  "subCode": "A01090201",
  "title": "과학영농 실천을 위한 토양정보시스템 흙토람",
  "summary": "농사를 짓고자 할 때 토양특성에 맞는 작물을 제시해 주고...",
  "content": "❭ 40여년간 국책사업으로 수행한 토양조사 결과를 전산화...",
  "htmlFile": "A01090201.html",
  "pdfFile": "A01090201.pdf",
  "contact": "담당자 : 농업연구사 최은영 031-290-0346",
  "videoUrl": null,
  "isActive": true,
  "registeredAt": "2009-06-12T15:01:19"
}
```

### 1.7 FarmBalance 활용 방안

| 활용처 | 방법 |
|--------|------|
| **AI 추천 보조** | 분류코드 `A010904`(원예), `A010906`(작물)의 기술 정보를 추천 결과에 링크 |
| **RAG 인제스트** | PDF 파일을 다운로드 → 벡터 DB에 적재 → 챗봇 답변 소스 |
| **재배 참조** | 농업인이 재배 기술 가이드 열람 시 참고 자료로 제공 |

---

## 2. 원클릭 농업기술 (`oneClickFarmngTchnlgy`)

### 2.1 서비스 개요

| 항목 | 내용 |
|------|------|
| **Base URL** | `http://api.nongsaro.go.kr/service/oneClickFarmngTchnlgy/` |
| **Method** | `GET` |
| **총 데이터** | 확인 필요 |

### 2.2 오퍼레이션

| # | 오퍼레이션 | 설명 |
|:-:|---------|------|
| 1 | `oneClickFarmngTchnlgyClassSubCodeLst` | 서브 분류 목록 |
| 2 | `oneClickFarmngTchnlgyClassSubMenuLst` | 서브 메뉴 목록 |

### 2.3 서브 분류 목록 (`oneClickFarmngTchnlgyClassSubCodeLst`)

**요청 파라미터:**

| 파라미터 | 필수 | 설명 |
|---------|:----:|------|
| `apiKey` | ○ | 인증키 |
| `classCode` | ○ | 메인 분류코드 |

**응답 필드:**

| XML 필드 | JSON 키 | 설명 |
|---------|-----------|------|
| `classSubCode` | `subCode` | 서브 분류코드 |
| `classSubNo` | `subNo` | 번호 |
| `classSubName` | `subName` | 분류명 |

### 2.4 서브 메뉴 목록 (`oneClickFarmngTchnlgyClassSubMenuLst`)

**요청 파라미터:**

| 파라미터 | 필수 | 설명 |
|---------|:----:|------|
| `apiKey` | ○ | 인증키 |
| `classSubCode` | ○ | 서브 분류코드 |

**응답 필드:**

| XML 필드 | JSON 키 | 설명 |
|---------|-----------|------|
| `classMenuCode` | `menuCode` | 메뉴 코드 |
| `classMenuName` | `menuName` | 메뉴명 |
| `classMenuFilename` | `menuFilename` | 메뉴 파일명 |
| `classSubPriceUrl` | `priceUrl` | 가격정보 URL |
| `classSubDayworkUrl` | `workScheduleUrl` | 작업일정 URL |
| `classSubPayUrl` | `incomeUrl` | 소득정보 URL |
| `classMenuDetail` | `techDetailUrl` | 작목기술정보 URL |
| `classSubMovieUrl` | `videoUrl` | 영상 URL |
| `classMenuMaster` | `contact` | 담당자 정보 |

---

## 3. 병해충발생정보 (`dbyhsCccrrncInfo`)

> 기존 문서 `API_농사로_재배기술_명세서.md` § 7에 상세 기재. 여기서는 요약만 기록.

### 3.1 오퍼레이션

| # | 오퍼레이션 | 설명 |
|:-:|---------|------|
| 1 | `dbyhsCccrrncInfoYear` | 연도 목록 (2010~2026, 총 249건) |
| 2 | `dbyhsCccrrncInfoList` | 해당 연도 보고서 목록 |

### 3.2 JSON 변환 예시

```json
{
  "cntntsNo": "12345",
  "title": "병해충발생정보 제 15호 (2024.12.1.~12.31.)",
  "reportYear": "2024",
  "pdfUrl": "http://...downFile...",
  "fileName": "병해충발생정보_2024_15.pdf",
  "registeredAt": "2024-12-31"
}
```

---

## 4. 품종 정보 (`varietyInfo`)

### 4.1 서비스 개요

| 항목 | 내용 |
|------|------|
| **Base URL** | `http://api.nongsaro.go.kr/service/varietyInfo/` |
| **총 데이터** | 2,604건 |

### 4.2 오퍼레이션

| # | 오퍼레이션 | 설명 |
|:-:|---------|------|
| 1 | `varietyList` | 품종 목록 |

### 4.3 응답 필드

| XML 필드 | JSON 키 | 설명 |
|---------|-----------|------|
| `cntntsNo` | `id` | 콘텐츠 번호 |
| `cntntsSj` | `varietyName` | 품종명 (예: "청춘채(Cheongchunchae)") |
| `svcCodeNm` | `cropName` | 작물명 (예: "상추") |
| `prdlstCtgCode` | `categoryCode` | 품목 카테고리 코드 (예: "VC021005") |
| `upperSvcCode` | `upperCode` | 상위 분류코드 (예: "VC02") |
| `mainChartrInfo` | `characteristics` | 주요 특성 설명 |
| `unbrngInsttInfo` | `breedingInstitute` | 육성기관 |
| `unbrngYear` | `breedingYear` | 육성연도 |
| `imgFileLink` | `imageUrl` | 품종 이미지 URL |
| `atchFileLink` | `attachmentUrl` | 첨부파일 (품종요약서) URL |
| `orginlFileNm` | `fileName` | 원본 파일명 |
| `svcDt` | `serviceDate` | 서비스 등록일 |

### 4.4 JSON 변환 예시

```json
{
  "id": 265051,
  "varietyName": "청춘채(Cheongchunchae)",
  "cropName": "상추",
  "categoryCode": "VC021005",
  "upperCode": "VC02",
  "characteristics": "- 진한 자색의 치마 상추\n- 고온기 색택 발현이 좋음",
  "breedingInstitute": "농촌진흥청 국립원예특작과학원 원예작물부 채소기초기반과",
  "breedingYear": "2025",
  "imageUrl": "https://www.nongsaro.go.kr/portal/imgView.do?ep=...",
  "attachmentUrl": "http://atis.rda.go.kr/sys/file/extrlDownloadFile.do?...",
  "fileName": "품종요약서_원교11-37호(지적75호)_제출본.hwpx"
}
```

### 4.5 FarmBalance 활용 방안

| 활용처 | 방법 |
|--------|------|
| **종자 등록** | 재배 의향 등록 시 품종 선택 참고자료 제공 |
| **AI 추천** | 추천 작물의 적합 품종 정보 함께 제공 |
| **RAG 소스** | 품종요약서(HWP) 파일을 인제스트하여 챗봇 답변 근거로 활용 |

---

## 5. 농작물재해예방정보 (`frcDsstrPrevnt`)

### 5.1 서비스 개요

| 항목 | 내용 |
|------|------|
| **Base URL** | `http://api.nongsaro.go.kr/service/frcDsstrPrevnt/` |
| **Method** | `GET` |
| **총 데이터** | 320건 (2011~2026년) |
| **활용처** | 기상 연계 재해 알림, RAG 인제스트, 재배 안전 가이드 |

### 5.2 오퍼레이션

| # | 오퍼레이션 | 설명 | 목록 | 페이징 |
|:-:|---------|------|:----:|:-----:|
| 1 | `frcDsstrPrevntYear` | 검색년도 목록 | ○ | — |
| 2 | `frcDsstrPrevntLst` | 재해예방정보 목록 | ○ | ○ |

### 5.3 연도 목록 (`frcDsstrPrevntYear`)

**요청 파라미터:**

| 파라미터 | 필수 | 설명 |
|---------|:----:|------|
| `apiKey` | ○ | 인증키 |
| `sType` | — | 검색구분 |
| `sText` | — | 검색어 |

**응답:** `yearCode` (연도코드) — 2011~2026 (16개 연도)

### 5.4 재해예방정보 목록 (`frcDsstrPrevntLst`)

**요청 파라미터:**

| 파라미터 | 필수 | 설명 |
|---------|:----:|------|
| `apiKey` | ○ | 인증키 |
| `sYear` | — | 연도 |
| `sText` | — | 검색어 |
| `sType` | — | 검색구분 |
| `pageNo` | — | 페이지 번호 |
| `numOfRows` | — | 한 페이지 건수 |

**응답 필드 → JSON 매핑:**

| XML 필드 | JSON 키 | 설명 |
|---------|-----------|------|
| `cntntsNo` | `id` | 콘텐츠 번호 (PK) |
| `cntntsSj` | `title` | 제목 |
| `cntntsRdcnt` | `viewCount` | 조회수 |
| `rtnFileSeCode` | `fileTypeCode` | 파일 구분코드 |
| `rtnFileSn` | `fileSeqNo` | 파일 순번 |
| `rtnOrginlFileNm` | `originalFileName` | 원본 파일명 |
| `rtnStreFileNm` | `storedFileName` | 저장 파일명 |
| `rtnFileCours` | `filePath` | 파일 경로 |
| `rtnImageDc` | `imageDesc` | 이미지 설명 |
| `rtnThumbFileNm` | `thumbnailFileName` | 썸네일 파일명 |
| `svcDtx` | `publishedDate` | 등록 일시 (YYYY-MM-DD) |
| `svcDt` | `publishedDateTime` | 등록 일시 (DATE) |
| `noticeAt` | `isNotice` | 공지 여부 (`Y`/`N`) |
| `updusrEsntlNm` | `authorName` | 작성자명 |

### 5.5 실제 응답 예시 (XML → JSON 변환)

**원본 XML:**
```xml
<item>
  <cntntsNo><![CDATA[266960]]></cntntsNo>
  <cntntsSj><![CDATA[2026년 농작물 재해예방 관리기술 정보(제4호)]]></cntntsSj>
  <cntntsRdcnt><![CDATA[135]]></cntntsRdcnt>
  <rtnOrginlFileNm><![CDATA[2026년 농작물 재해예방 관리기술 정보(제4호).pdf]]></rtnOrginlFileNm>
  <rtnStreFileNm><![CDATA[266960_MF_ATTACH_01.pdf]]></rtnStreFileNm>
  <rtnFileCours><![CDATA[cms_contents/44]]></rtnFileCours>
  <noticeAt><![CDATA[Y]]></noticeAt>
  <svcDtx><![CDATA[2026-04-02]]></svcDtx>
  <updusrEsntlNm><![CDATA[이우일]]></updusrEsntlNm>
</item>
```

**변환 JSON:**
```json
{
  "id": 266960,
  "title": "2026년 농작물 재해예방 관리기술 정보(제4호)",
  "viewCount": 135,
  "originalFileName": "2026년 농작물 재해예방 관리기술 정보(제4호).pdf",
  "storedFileName": "266960_MF_ATTACH_01.pdf",
  "filePath": "cms_contents/44",
  "isNotice": true,
  "publishedDate": "2026-04-02",
  "authorName": "이우일"
}
```

### 5.6 PDF 다운로드 URL 구성

> [!IMPORTANT]
> 응답에 직접적인 다운로드 URL이 없습니다. `filePath` + `storedFileName`을 조합하여 추정합니다.
> 실제 다운로드 URL 패턴은 구현 시 추가 검증이 필요합니다.

### 5.7 FarmBalance 활용 방안

| 활용처 | 방법 |
|--------|------|
| **기상 연계 알림** | 기상청 API(폭염/한파/장마)와 연계하여 해당 시기 재해예방 가이드 푸시 |
| **RAG 인제스트** | 재해예방 PDF → 벡터 DB 적재 → 챗봇이 재해 대응 방법 안내 |
| **대시보드** | 지자체 담당자가 월별 재해예방 정보를 모니터링 |

---

## 6. 농작업일정 정보 (`farmWorkingPlanNew`)

### 6.1 서비스 개요

| 항목 | 내용 |
|------|------|
| **Base URL** | `http://api.nongsaro.go.kr/service/farmWorkingPlanNew/` |
| **Method** | `GET` |
| **응답 형식** | XML (기본) / JSON (5번 오퍼레이션) |
| **품목 분류** | 10개 (논농사, 밭농사, 버섯, 약초, 채소, 과수, 화훼, 축산, 사료작물, Foreign workers) |
| **활용처** | 월별 농작업 캘린더, 재배 일정 자동 알림, AI 추천 보조 |

### 6.2 오퍼레이션

| # | 오퍼레이션 | 설명 | 유형 |
|:-:|---------|------|:----:|
| 1 | `workScheduleGrpList` | 품목코드 정보 조회 | 목록 |
| 2 | `workScheduleLst` | 농작업일정 목록 정보 조회 | 목록 |
| 3 | `workScheduleDtl` | 농작업일정 기본 상세 정보 조회 | 상세 |
| 4 | `workScheduleEraInfoLst` | 농작업일정 시기 상세 정보 조회 (HTML) | 목록 |
| 5 | `workScheduleEraInfoJsonLst` | 농작업일정 시기 상세 정보 JSON 조회 | 목록 |

### 6.3 품목코드 조회 (`workScheduleGrpList`)

**요청:** `apiKey`만 필수

**응답 (실제 데이터):**

| 코드 | 품목명 | 순서 |
|------|--------|:----:|
| `210004` | 논농사 | 1 |
| `210005` | 밭농사 | 2 |
| `210008` | 버섯 | 3 |
| `210009` | 약초 | 4 |
| `210001` | 채소 | 5 |
| `210002` | 과수 | 6 |
| `210003` | 화훼 | 7 |
| `210007` | 축산 | 8 |
| `210010` | 사료작물 | 9 |
| `210011` | Foreign workers | 11 |

### 6.4 농작업일정 목록 (`workScheduleLst`)

**요청 파라미터:**

| 파라미터 | 필수 | 설명 |
|---------|:----:|------|
| `apiKey` | ○ | 인증키 |
| `kidofcomdtySeCode` | ○ | 품목코드 (예: `210004`) |

**응답 필드 → JSON 매핑:**

| XML 필드 | JSON 키 | 설명 |
|---------|-----------|------|
| `cntntsNo` | `id` | 콘텐츠 번호 (PK) |
| `sj` | `title` | 제목 (예: "벼 기계이앙재배") |
| `fileDownUrlInfo` | `fileDownloadUrl` | 첨부파일 다운로드 URL |
| `fileName` | `fileName` | 첨부파일명 |
| `fileSeCode` | `fileTypeCode` | 파일 구분코드 |
| `orginlFileNm` | `originalFileName` | 원본 파일명 |

### 6.5 농작업일정 기본 상세 (`workScheduleDtl`)

**요청:** `apiKey` + `cntntsNo`

**응답 필드:**

| XML 필드 | JSON 키 | 설명 |
|---------|-----------|------|
| `cntntsNo` | `id` | 콘텐츠 번호 |
| `cn` | `content` | 내용 (HTML, 최대 4000자) |
| `kidofcomdtySeCode` | `cropCode` | 품목코드 |
| `kidofcomdtySeCodeNm` | `cropName` | 품목명 |

### 6.6 시기 상세 JSON (`workScheduleEraInfoJsonLst`) ⭐

> FarmBalance에서 가장 활용도 높은 오퍼레이션

**요청:** `apiKey` + `cntntsNo`

**응답 필드 → JSON 매핑:**

| XML 필드 | JSON 키 | 설명 | 예시 |
|---------|-----------|------|------|
| `cntntsNo` | `id` | 콘텐츠 번호 | `30697` |
| `kidofcomdtySeCode` | `cropCode` | 품목코드 | `210004` |
| `kidofcomdtySeCodeNm` | `cropName` | 품목명 | `논농사` |
| `farmWorkFlag` | `farmWorkType` | 농작업 구분 | `벼 기계이앙재배` |
| `infoSeCode` | `infoTypeCode` | 정보 시기 유형 코드 | `410001` |
| `infoSeCodeNm` | `infoTypeName` | 정보 시기 유형명 | `생육과정(주요농작업)` |
| `opertNm` | `operationName` | 시기별 작업 명 | `모기르기` |
| `beginMon` | `startMonth` | 작업 시작 월 | `4` |
| `beginEra` | `startPeriod` | 작업 시작 시기 | `중` (상/중/하) |
| `endMon` | `endMonth` | 작업 종료 월 | `5` |
| `endEra` | `endPeriod` | 작업 종료 시기 | `중` (상/중/하) |
| `reqreMonth` | `durationMonths` | 소요 개월 | `4` |
| `vodUrl` | `videoUrl` | 동영상 URL | (있는 경우) |

### 6.7 실제 응답 예시 (JSON 변환)

**벼 기계이앙재배 (`cntntsNo=30697`) — 시기별 작업일정:**

```json
[
  {
    "id": 30697,
    "cropCode": "210004",
    "cropName": "논농사",
    "farmWorkType": "벼 기계이앙재배",
    "infoTypeCode": "410001",
    "infoTypeName": "생육과정(주요농작업)",
    "operationName": "모기르기",
    "startMonth": 4,
    "startPeriod": "중",
    "endMonth": 5,
    "endPeriod": "중",
    "durationMonths": 4,
    "videoUrl": null
  },
  {
    "id": 30697,
    "cropCode": "210004",
    "cropName": "논농사",
    "infoTypeCode": "410001",
    "infoTypeName": "생육과정(주요농작업)",
    "operationName": "모내기때",
    "startMonth": 5,
    "startPeriod": "중",
    "endMonth": 6,
    "endPeriod": "중",
    "durationMonths": 4
  },
  {
    "id": 30697,
    "cropCode": "210004",
    "cropName": "논농사",
    "infoTypeCode": "410003",
    "infoTypeName": "병충해 방제",
    "operationName": "잎도열병, 벼물바구미, 이화명나방",
    "startMonth": 5,
    "startPeriod": "중",
    "endMonth": 6,
    "endPeriod": "중",
    "durationMonths": 4
  }
]
```

### 6.8 정보 시기 유형 코드 (`infoSeCode`)

| 코드 | 유형명 | 설명 |
|------|--------|------|
| `410001` | 생육과정(주요농작업) | 시기별 핵심 농작업 |
| `410002` | 기상재해 및 예상되는 문제점 | 자연재해 리스크 |
| `410003` | 병충해 방제 | 병해충 방제 일정 |

### 6.9 FarmBalance 활용 방안

| 활용처 | 방법 |
|--------|------|
| **농작업 캘린더** | `workScheduleEraInfoJsonLst` → 월별 농작업 타임라인 UI 구성 |
| **재배 의향 등록** | 등록된 작물의 향후 농작업 일정 자동 안내 |
| **AI 추천 보조** | 추천 작물의 연간 작업량/난이도 비교 데이터로 활용 |
| **푸시 알림** | 현재 월 기준 해야 할 농작업을 푸시 알림 |
| **병충해 연계** | `infoSeCode=410003`(병충해 방제) 데이터를 병해충발생정보 API와 크로스 참조 |

---

## 7. 친환경농업 우수사례 (`evrfrndFarmng`)

### 7.1 서비스 개요

| 항목 | 내용 |
|------|------|
| **Base URL** | `http://api.nongsaro.go.kr/service/evrfrndFarmng/` |
| **Method** | `GET` |
| **총 데이터** | 66건 |
| **지역** | 충청남도 (현재 1개 지역만 등록) |
| **활용처** | 친환경 재배 사례 참고, RAG 인제스트, 커뮤니티 콘텐츠 |

### 7.2 오퍼레이션

| # | 오퍼레이션 | 설명 | 목록 | 페이징 |
|:-:|---------|------|:----:|:-----:|
| 1 | `selectAreaInfoLst` | 지역코드 목록 | ○ | — |
| 2 | `evrfrndFarmngLst` | 친환경농업 우수사례 목록 | ○ | ○ |

### 7.3 지역코드 목록 (`selectAreaInfoLst`)

**요청:** `apiKey`만 필수

**응답 (실제):** 현재 `충청남도` 1개만 등록됨

| XML 필드 | JSON 키 | 설명 |
|---------|-----------|------|
| `code` | `regionCode` | 지역코드 |
| `codeNm` | `regionName` | 지역명 |

### 7.4 우수사례 목록 (`evrfrndFarmngLst`)

**요청 파라미터:**

| 파라미터 | 필수 | 설명 |
|---------|:----:|------|
| `apiKey` | ○ | 인증키 |
| `sText` | — | 검색어 |
| `sAreaNm` | — | 검색조건 지역 |
| `pageNo` | — | 페이지 번호 |
| `numOfRows` | — | 한 페이지 건수 |

**응답 필드 → JSON 매핑:**

| XML 필드 | JSON 키 | 설명 |
|---------|-----------|------|
| `cntntsNo` | `id` | 콘텐츠 번호 (PK) |
| `cntntsSj` | `title` | 제목 |
| `areaNm` | `regionName` | 국가/지역명 |
| `rtnOrginlFileNm` | `fileName` | 주소 |
| `rtnFileSn` | `fileSeqNo` | 설립년도 |
| `rtnFileSeCode` | `fileTypeCode` | 연락처 |
| `linkUrl` | `linkUrl` | 홈페이지 URL |

### 7.5 실제 응답 예시

```json
{
  "id": 104909,
  "title": "친환경농업을 이용한 유기농 쌀 생산(연기 이병주)",
  "regionName": "충청남도",
  "fileName": "download.pdf",
  "linkUrl": "http://cnnongup.chungnam.go.kr/home/board/B0010.cs?act=read&articleId=145061"
}
```

### 7.6 FarmBalance 활용 방안

| 활용처 | 방법 |
|--------|------|
| **커뮤니티** | 친환경 재배 성공 사례를 커뮤니티 게시판에 자동 큐레이션 |
| **RAG 인제스트** | PDF 사례집 → 벡터 DB → 친환경 재배 노하우 챗봇 답변 |
| **AI 추천** | 친환경 인증 여부를 작물 추천 가점 항목으로 활용 |

---

## 8. 품목별 관리매뉴얼 (`farmWorkingPlan`)

> [!TIP]
> 6번 `farmWorkingPlanNew`(농작업일정 정보)와 **동일한 품목코드 체계**를 공유하지만, 오퍼레이션이 다르고 **작물 단위 세부 일정 파일(HWP)**을 제공합니다.

### 8.1 서비스 개요

| 항목 | 내용 |
|------|------|
| **Base URL** | `http://api.nongsaro.go.kr/service/farmWorkingPlan/` |
| **Method** | `GET` |
| **품목 분류** | 10개 (농작업일정과 동일) |
| **작물 단위 일정** | 채소만 51개 (가지, 갓, 결구상추, 고춤, 마늘, 토마토 등) |
| **쳊부파일** | HWP/PDF 다운로드 URL 직접 제공 |
| **활용처** | 작물별 세부 매뉴얼, RAG 인제스트, 재배 가이드 |

### 8.2 오퍼레이션

| # | 오퍼레이션 | 설명 | 목록 | 페이징 |
|:-:|---------|------|:----:|:-----:|
| 1 | `workScheduleGrpList` | 품목 리스트 | ○ | — |
| 2 | `workScheduleLst` | 품목별 일정리스트 정보 | ○ | — |

### 8.3 품목 리스트 (`workScheduleGrpList`)

**요청:** `apiKey`만 필수

**응답:** 6번 `farmWorkingPlanNew`와 동일한 품목코드 체계 (210001~210011)

### 8.4 품목별 일정리스트 (`workScheduleLst`)

**요청 파라미터:**

| 파라미터 | 필수 | 설명 |
|---------|:----:|------|
| `apiKey` | ○ | 인증키 |
| `kidofcomdtySeCode` | ○ | 품목코드 (예: `210001` = 채소) |

**응답 필드 → JSON 매핑:**

| XML 필드 | JSON 키 | 설명 |
|---------|-----------|------|
| `cntntsNo` | `id` | 콘텐츠 번호 (PK) |
| `sj` | `title` | 제목 (예: "가지") |
| `fileDownUrlInfo` | `fileDownloadUrl` | 첨부파일 다운로드 URL |
| `fileName` | `fileName` | 파일명 (예: "가지 농작업일정.hwpx") |
| `fileSeCode` | `fileTypeCode` | 파일 구분코드 |
| `orginlFileNm` | `originalFileName` | 원본 파일명 |

### 8.5 실제 응답 예시 (채소 `210001` 일부)

```json
[
  {
    "id": 30770,
    "title": "가지",
    "fileDownloadUrl": "http://www.nongsaro.go.kr/portal/contentsFileDownload.do?ep=...",
    "fileName": "가지 농작업일정.hwpx",
    "fileTypeCode": "185001"
  },
  {
    "id": 30600,
    "title": "고추(보통재배)",
    "fileDownloadUrl": "http://www.nongsaro.go.kr/portal/contentsFileDownload.do?ep=...",
    "fileName": "고추(보통재배) 농작업일정.hwpx",
    "fileTypeCode": "185001"
  },
  {
    "id": 30646,
    "title": "토마토,방울토마토",
    "fileDownloadUrl": "http://www.nongsaro.go.kr/portal/contentsFileDownload.do?ep=...",
    "fileName": "토마토,방울토마토 농작업일정.hwpx",
    "fileTypeCode": "185001"
  }
]
```

### 8.6 `farmWorkingPlan` vs `farmWorkingPlanNew` 비교

| 항목 | `farmWorkingPlan` (매뉴얼) | `farmWorkingPlanNew` (일정) |
|------|:---:|:---:|
| 품목코드 체계 | 동일 | 동일 |
| 오퍼레이션 수 | 2개 | 5개 |
| **작물 단위 데이터** | ✅ (HWP/PDF 파일 다운로드) | ❌ |
| **시기별 구조화 데이터** | ❌ | ✅ (JSON 응답) |
| **활용 전략** | RAG 인제스트 용 | 캘린더 UI 용 |

### 8.7 FarmBalance 활용 방안

| 활용처 | 방법 |
|--------|------|
| **RAG 인제스트** | 작물별 HWP 파일 다운로드 → 텍스트 추출 → 벡터 DB 적재 |
| **재배 가이드** | 농업인이 재배 의향 등록 시 해당 작물의 매뉴얼 파일 제공 |
| **AI 챗봇** | 작물별 상세 재배 노하우 질의 응답 근거 |

---

## 공통: XML → JSON 파싱 가이드

### 1. 의존성 (build.gradle)

```groovy
implementation 'com.fasterxml.jackson.dataformat:jackson-dataformat-xml'
```

### 2. 공통 응답 래퍼

```java
@JacksonXmlRootElement(localName = "response")
public class NongsaroApiResponse<T> {
    private NongsaroHeader header;
    private NongsaroBody<T> body;
}

public class NongsaroHeader {
    private String resultCode;  // "00" = 성공
    private String resultMsg;
}

public class NongsaroBody<T> {
    private NongsaroItems<T> items;
}

public class NongsaroItems<T> {
    @JacksonXmlElementWrapper(useWrapping = false)
    private List<T> item;
    private int numOfRows;
    private int pageNo;
    private int totalCount;
}
```

### 3. 에러 코드 핸들링

| resultCode | 의미 | 대응 |
|:---:|--------|------|
| `00` | 정상 | 데이터 파싱 진행 |
| `12` | 인증키 미매칭/만료 | API 키 확인, 재신청 |
| `13` | 유효하지 않은 요청주소 | 서비스명/오퍼레이션 확인 |
| `99` | 인증키 오류 | API 키 재발급 |

### 4. CDATA 처리

농사로 API는 대부분의 값을 `<![CDATA[...]]>`로 감싸서 반환합니다. Jackson XML은 CDATA를 자동으로 벗겨주므로 별도 처리 불필요합니다.

### 5. Spring Boot 호출 흐름

```
[프론트엔드] → [BFF Route Handler] → [Spring Boot Controller]
                                        → [ExternalApiAdapter]
                                           → GET http://api.nongsaro.go.kr/service/{서비스명}/{오퍼레이션}
                                        → [XML 파싱 → JSON 변환]
                                     ← [응답 DTO]
```

### 6. XML 파싱 코드 예시

```java
// RestTemplate + Jackson XML
String xml = restTemplate.getForObject(url, String.class);
XmlMapper xmlMapper = new XmlMapper();
NongsaroApiResponse<AdvancedFarmTechItem> response =
    xmlMapper.readValue(xml, new TypeReference<>() {});
```

---

> [!IMPORTANT]
> **전체 9개 서비스 + 공통코드 명세서 작성 완료!**
> - ✅ 정상 확인: 8개 서비스 + 공통코드
> - ❌ 인증키 미매칭: 1개 (작목별농업기술정보 `cropEbook`)
> - 다음 단계: Spring Boot `ExternalApiAdapter` 구현 시작

---

## 부록: 공통코드 서비스 (`commonCode`)

> 농사로 API 전체에서 사용되는 코드 체계를 조회하는 유틸리티 서비스

### A.1 서비스 개요

| 항목 | 내용 |
|------|------|
| **Base URL** | `http://api.nongsaro.go.kr/service/commonCode/` |
| **Method** | `GET` |
| **코드 체계** | 표준코드 (2단계) + 공통코드 (3단계) |
| **활용처** | 다른 API에서 사용하는 분류코드, 품목코드 등의 마스터 데이터 조회 |

### A.2 오퍼레이션

| # | 오퍼레이션 | 설명 | 목록 | 페이징 |
|:-:|---------|------|:----:|:-----:|
| 1 | `standardTopCodeLst` | 표준코드 1차 목록 | ○ | — |
| 2 | `standardSubCodeLst` | 표준코드 2차 목록 | ○ | ○ |
| 3 | `commonTopCodeLst` | 공통코드 1차 목록 | ○ | — |
| 4 | `commonMiddleCodeLst` | 공통코드 2차 목록 | ○ | ○ |
| 5 | `commonBottomCodeLst` | 공통코드 3차 목록 | ○ | ○ |

### A.3 표준코드 1차 목록 (`standardTopCodeLst`)

**요청:** `apiKey`만 필수

**응답 (실제 데이터):**

| 코드 | 코드명 |
|------|--------|
| `001001` | 농업기술정보 서비스 코드 |
| `001002` | 식품상태코드 |
| `001003` | 식품유통코드 |
| `001004` | 식품코드 |
| `001005` | 품목표준코드 |

**응답 필드:**

| XML 필드 | JSON 키 | 설명 |
|---------|-----------|------|
| `code` | `code` | 분류 코드 |
| `codeNm` | `codeName` | 분류 코드명 |

### A.4 표준코드 2차 목록 (`standardSubCodeLst`)

> 표준코드를 트리 구조로 탐색하는 오퍼레이션. 총 **2,184건** (품목표준코드 `001005` 기준)

**요청 파라미터:**

| 파라미터 | 필수 | 설명 |
|---------|:----:|------|
| `apiKey` | ○ | 인증키 |
| `sUpperCode` | ○ | 표준코드 1차 선택코드 |
| `pageNo` | — | 페이지 번호 |
| `numOfRows` | — | 한 페이지 건수 |

**응답 필드 → JSON 매핑:**

| XML 필드 | JSON 키 | 설명 | 예시 |
|---------|-----------|------|------|
| `nLevel` | `level` | 코드레벨 (1~4) | `1` |
| `stdCodeCl` | `standardCodeClass` | 표준코드분류(작목,기술등) | `001005` |
| `clCode` | `classCode` | 분류코드(대중소) | `002001` |
| `svcCode` | `serviceCode` | 서비스코드(실제코드) | `AE` |
| `upperSvcCode` | `parentServiceCode` | 상위서비스코드(실제코드) | `null` |
| `svcCodeNm` | `serviceCodeName` | 서비스 코드명 | `농업공학` |
| `chdYn` | `hasChildren` | 하위코드 존재여부 | `Y` |

**계층 예시 (품목표준코드 `001005`):**

```
Level 1: AE (농업공학)
  Level 2: AE01 (농업동력)
    Level 3: AE01AE11 (농용트랙터)
      Level 4: AE01AE1101 (경운기)
      Level 4: AE01AE1104 (트랙터)
```

### A.5 공통코드 1차 목록 (`commonTopCodeLst`)

**요청:** `apiKey`만 필수

**응답 (실제 데이터 — 28개):**

| 코드 | 코드명 |
|------|--------|
| `016001` | 공유네트워크포탈 |
| `016002` | 대표홈페이지 |
| `016005` | 유기농정보 |
| `016009` | 농기계종합정보 |
| `016013` | 천연작물보호소재 |
| `016014` | 병해충정보 |
| `016023` | 흙토람 |
| `016024` | ATIS |
| ... | *(총 28개)* |

### A.6 공통코드 2차 목록 (`commonMiddleCodeLst`)

**요청 파라미터:**

| 파라미터 | 필수 | 설명 |
|---------|:----:|------|
| `apiKey` | ○ | 인증키 |
| `sSvcRealmCode` | ○ | 공통코드 1차 선택코드 |
| `pageNo` | — | 페이지 번호 |
| `numOfRows` | — | 한 페이지 건수 |

**응답 필드:**

| XML 필드 | JSON 키 | 설명 |
|---------|-----------|------|
| `codeGroupId` | `groupId` | 코드레벨 |
| `codeGroupDc` | `groupDescription` | 표준코드분류(작목,기술등) |
| `codeGroupNm` | `groupName` | 분류코드(대중소) |
| `sortOrdr` | `sortOrder` | 서비스코드(실제코드) |
| `svcRealmCode` | `realmCode` | 상위서비스코드(실제코드) |

### A.7 공통코드 3차 목록 (`commonBottomCodeLst`)

**요청 파라미터:**

| 파라미터 | 필수 | 설명 |
|---------|:----:|------|
| `apiKey` | ○ | 인증키 |
| `sCodeGroup` | ○ | 공통코드 2차 선택코드 |
| `pageNo` | — | 페이지 번호 |
| `numOfRows` | — | 한 페이지 건수 |

**응답 필드:**

| XML 필드 | JSON 키 | 설명 |
|---------|-----------|------|
| `nLevel` | `level` | 코드레벨 |
| `codeGroupId` | `groupId` | 코드그룹ID |
| `code` | `code` | 코드 |
| `upperCode` | `parentCode` | 상위코드 |
| `codeNm` | `codeName` | 코드명 |
| `sortOrdr` | `sortOrder` | 순서 |
| `chdYn` | `hasChildren` | 하위그룹 존재여부 |

### A.8 FarmBalance 활용 방안

| 활용처 | 방법 |
|--------|------|
| **품목코드 매핑** | `standardSubCodeLst`(001005)로 농사로 품목코드 ↔ FarmBalance 작물코드 매핑 테이블 구축 |
| **동적 필터** | 프론트엔드에서 작물 분류 드롭다운을 공통코드로 동적 생성 |
| **코드 동기화** | 배치 작업으로 주기적으로 공통코드 변경사항 반영 |

