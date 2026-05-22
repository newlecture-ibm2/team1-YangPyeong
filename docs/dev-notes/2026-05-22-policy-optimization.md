# 📋 정책 도메인 최적화 작업 내역 (2026-05-22)

> **작업자**: skpark (with AI)  
> **브랜치**: `dev-sookyung`  
> **이전 커밋**: `039ee5e8` (fix: 가게 지도 FilterBar margin-bottom 제거)  
> **작업 일시**: 2026-05-22 17:47 ~ 18:22 KST

---

## 🎯 문제 요약

사용자 관점에서 **정책 목록 페이지와 맞춤 추천 페이지의 데이터 불일치**가 심각했음:

| 페이지 | 문제 |
|--------|------|
| `/policy` 정책 목록 | **"총 6건"**만 표시 (실제 DB 69건) |
| `/policy/recommend` 맞춤 추천 | 많은 정책이 표시됨 |

추가로:
- 마감된 정책이 목록 맨 위에 노출
- 추천 페이지 진입마다 불필요한 AI 토큰 소모

---

## ✅ 변경 파일 목록 (6개)

### 1. `Gov24PolicyClient.java` — 수집 범위 확대
- **경로**: `backend/.../policy/adapter/out/external/Gov24PolicyClient.java`
- **변경**: 
  - `MAX_PAGES`: 5 → **20** (500건 → 2000건 탐색)
  - `FARM_KEYWORDS`: 18개 → **38개** (특용작물, 과수, 채소, 청년농, 직불금, 보조금 등 추가)
- **이유**: Gov24 API에서 농업 관련 정책이 분산되어 있어 좁은 키워드+적은 페이지로는 2건만 수집됨

### 2. `PolicyStartupSyncListener.java` — 앱 시작 시 자동 동기화 ⭐ 신규
- **경로**: `backend/.../policy/adapter/in/event/PolicyStartupSyncListener.java`
- **변경**: 새 파일 생성
- **동작**: 
  - `ApplicationReadyEvent` 감지 → DB 정책 0건이면 자동 동기화 1회 실행
  - `@Async`로 실행하여 앱 시작 지연 없음
  - 이미 데이터 있으면 건너뜀
- **이유**: 배포 직후/DB 초기화 후 빈 정책 목록 방지

### 3. `PolicyRecommendService.java` — AI 토큰 소모 제거
- **경로**: `backend/.../policy/application/service/PolicyRecommendService.java`
- **변경**:
  - `PolicyAiPort` 의존성 제거 (AI 서버 호출 삭제)
  - `PolicyGraphQueryPort` 의존성 제거 (GraphRAG 조회 삭제)
  - TOP 5 추천 사유를 **규칙 기반으로 직접 생성** (AI 호출 대신)
- **이유**: 
  - AI가 하는 일이 규칙 기반 사유를 "자연스러운 문장"으로 다듬는 것뿐 → 비용 대비 가치 없음
  - 추천 페이지 방문마다 AI 토큰 소모 → **0원**으로 절감
  - 응답 속도 **1-3초 단축**
- **⚠️ 프론트엔드 변경 없음**: 응답 DTO 구조 동일

### 4. `PolicyDataRepository.java` — 정렬 + 행정공고 필터 DB 이동
- **경로**: `backend/.../policy/adapter/out/persistence/repository/PolicyDataRepository.java`
- **변경**:
  - **정렬**: 활성(미마감) 정책 우선 → 마감 임박순 → 마감된 건 맨 아래
  - **행정공고 필터**: Java 후처리 → JPQL `NOT LIKE` 조건 23개로 DB 레벨 이동
- **이유**: 
  - 기존: `ORDER BY applyEnd ASC` → 마감된 게 맨 위
  - 기존: DB 10건 가져온 후 Java 필터 → 9건 제거 → 1건만 표시 (페이징 깨짐)

### 5. `PolicyQueryService.java` — Java 필터 제거
- **경로**: `backend/.../policy/application/service/PolicyQueryService.java`
- **변경**: `PolicyNoticeFilter` Java 필터 제거 (DB 쿼리로 이동했으므로)
- **이유**: DB 쿼리에서 이미 행정공고를 제외하므로 중복 필터 불필요

### 6. `PolicyController.java` — 총 건수 버그 수정
- **경로**: `backend/.../policy/adapter/in/web/PolicyController.java`
- **변경**: `policies.size()` → `searchPolicyUseCase.countPolicies(condition)`
- **이유**: 페이지 내 필터 후 개수(6건)가 총 건수로 표시되던 버그 수정

---

## 🧪 테스트 확인 사항

집에서 확인할 항목:

### 정책 목록 (`/policy`)
- [ ] 총 건수가 실제 DB 건수와 일치하는지 (69건 아닌 필터 후 건수)
- [ ] 1페이지에 10건이 정상 표시되는지
- [ ] 2페이지 이후도 정상 페이징되는지
- [ ] 활성 정책이 위에, 마감된 정책이 아래에 표시되는지
- [ ] 행정공고(채용, 허가, 위탁 등)가 목록에서 제외되는지
- [ ] 검색/필터(지역, 분야, 기간) 정상 동작하는지

### 맞춤 추천 (`/policy/recommend`)
- [ ] 로그인 후 추천 정책이 정상 표시되는지
- [ ] 추천 사유가 규칙 기반으로 잘 나오는지 (예: "거주 지역(양평군) 농업인을 위한 맞춤형 정책입니다.")
- [ ] AI 서버 없이도 추천 페이지가 정상 동작하는지
- [ ] TOP 5 + 관련 정책 섹션이 잘 구분되는지

### 기타
- [ ] 앱 시작 시 `PolicyStartupSyncListener` 로그 확인 ("정책 데이터 N건 존재 — 시작 시 동기화 생략")
- [ ] 백엔드 빌드 정상: `./gradlew clean build -x test`

---

## 🔧 향후 과제 (이번 커밋에 포함 안됨)

1. **Gov24 API 키 설정**: `gov24.api-key` 값이 `.env`에 없으면 Gov24 수집이 건너뛰어짐 → 키 확인 필요
2. **스케줄러 동기화 테스트**: 매일 새벽 3시 자동 동기화 (`PolicySyncScheduler`) 정상 동작 확인
3. **정책 상세 페이지**: 목록에서 "상세보기" 클릭 시 상세 페이지 연동 확인
4. **Soft-exclude 필터**: "업체 모집", "재공고" 등 약한 제외 키워드는 현재 DB 쿼리에 미포함 (Java `PolicyNoticeFilter`에만 존재) → 필요시 추가

---

## 📝 아키텍처 메모

```
정책 데이터 흐름 (변경 후):

[Gov24/Mafra/양평군 API]
        ↓ (스케줄러: 매일 03:00 / 앱 시작 시 0건이면 즉시)
   PolicySyncService → AI 정규화 → DB 저장
        ↓
   policy_data 테이블 (69건+)
        ↓                          ↓
  정책 목록 (searchPolicies)    맞춤 추천 (recommendForUser)
  - DB 쿼리에서 행정공고 제외    - findActivePolicies()
  - DB 페이징 정확               - 규칙 기반 점수+사유 (AI 호출 없음)
  - 활성 우선 정렬               - TOP 5 + 관련 20건
```
