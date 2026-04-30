# 📜 정책 목록 화면 구현 — 작업 인수인계

> **작업자:** dev-sookyung  
> **작업일:** 2026-04-29 ~ 2026-04-30  
> **브랜치:** `dev-sookyung`  
> **상태:** 코드 완성, DB Seed 미적용, 빌드 미검증 (로컬 JDK25 환경 이슈)

---

## 1. 작업 개요

FarmBalance 정책 목록 화면을 헥사고날 아키텍처 기반으로 풀스택 구현했습니다.

**데이터 흐름:**
```
[외부 API Mock] → PolicySyncService → policy_data DB (upsert)
                                            ↓
[프론트 /policy] → BFF Proxy → PolicyController → PolicyQueryService → DB 조회
```

---

## 2. 생성/수정된 파일 목록 (총 28개)

### 백엔드 신규 (19개)

| 파일 경로 | 레이어 | 설명 |
|-----------|--------|------|
| `policy/domain/model/PolicyData.java` | domain | 순수 POJO 도메인 모델 |
| `policy/domain/model/PolicySource.java` | domain | 수집 소스 enum (GOV24/MAFRA/CRAWL/SEED) |
| `policy/domain/model/PolicySearchCondition.java` | domain | 검색 조건 VO |
| `policy/application/port/in/SearchPolicyUseCase.java` | port/in | 정책 조회 UseCase |
| `policy/application/port/in/SyncPolicyUseCase.java` | port/in | 정책 동기화 UseCase + SyncResult record |
| `policy/application/port/out/PolicyQueryPort.java` | port/out | 조회 Output Port |
| `policy/application/port/out/PolicySavePort.java` | port/out | 저장/upsert Output Port |
| `policy/application/port/out/PolicyExternalFetchPort.java` | port/out | 외부 수집 Output Port |
| `policy/application/port/out/RegionNameResolvePort.java` | port/out | 지역코드→지역명 변환 Port |
| `policy/application/service/PolicyQueryService.java` | service | 조회 서비스 (Domain만 사용) |
| `policy/application/service/PolicySyncService.java` | service | 동기화 서비스 (다중 소스 upsert) |
| `policy/adapter/in/web/PolicyController.java` | web | REST Controller |
| `policy/adapter/in/web/dto/PolicyListResponse.java` | web/dto | 응답 DTO (record) |
| `policy/adapter/out/persistence/entity/PolicyDataJpaEntity.java` | entity | JPA Entity |
| `policy/adapter/out/persistence/repository/PolicyDataRepository.java` | repo | JPQL 동적 검색 쿼리 |
| `policy/adapter/out/persistence/adapter/PolicyPersistenceAdapter.java` | adapter | Persistence Adapter (Domain↔Entity 변환) |
| `policy/adapter/out/persistence/adapter/RegionNameResolveAdapter.java` | adapter | regions 테이블 직접 JdbcTemplate 조회 |
| `policy/adapter/out/external/Gov24PolicyClient.java` | external | 정부24 Mock (빈 목록 반환) |
| `policy/adapter/out/external/MafraPolicyClient.java` | external | 농식품부 Mock (빈 목록 반환) |

> 모든 경로 prefix: `backend/src/main/java/com/farmbalance/`

### 백엔드 수정 (2개)

| 파일 | 변경 내용 |
|------|-----------|
| `global/config/SecurityConfig.java` | `GET /api/policies/**` → `permitAll()` 추가 |
| `global/error/ErrorCode.java` | `POLICY_SYNC_FAILED` 에러 코드 추가 |

### DB/Seed (1개)

| 파일 | 설명 |
|------|------|
| `backend/src/main/resources/seed-policy.sql` | DDL 확장 + 15건 Seed 데이터 |

### 프론트엔드 신규 (5개)

| 파일 | 설명 |
|------|------|
| `app/(main)/policy/page.tsx` | 정책 목록 페이지 (카드 리스트, 필터, 페이지네이션) |
| `app/(main)/policy/page.module.css` | 페이지 스타일 (디자인 토큰 사용) |
| `app/(main)/policy/_lib/policy.types.ts` | 타입 + 필터 옵션 상수 |
| `app/(main)/policy/_lib/policy.api.ts` | BFF Proxy 경유 API 호출 |
| `app/(main)/policy/_lib/usePolicyList.ts` | 검색/필터/페이징 상태 관리 Hook |

### 프론트엔드 수정 (1개)

| 파일 | 변경 |
|------|------|
| `frontend/lib/constants.ts` | PUBLIC_PATHS에 `'/policy'` 추가 |

### 문서 수정 (1개)

| 파일 | 변경 |
|------|------|
| `docs/architecture/ERD.md` | policy_data mermaid 다이어그램 + 2.15 상세 명세 확장 |

### 삭제된 파일 (10개)

모두 `.gitkeep` 파일 — 실제 코드가 생성되었으므로 불필요해져 삭제.

---

## 3. DB 변경 사항 (반드시 적용 필요)

### 실행 방법
```bash
psql -U farmbalance -d farmbalance -f backend/src/main/resources/seed-policy.sql
```

### DDL 변경 요약
- `policy_data` 테이블에 정규화 컬럼 12개 추가 (`source`, `title`, `organization`, `region_code`, `category`, `target`, `content`, `support_amount`, `apply_start`, `apply_end`, `source_url`, `raw_data`)
- 기존 `data` 컬럼은 **유지** (하위 호환), `raw_data`를 신규 추가
- `(external_id, source)` 복합 유니크 제약 추가
- 검색 인덱스 5개 추가

### Seed 데이터
- 15건, `source='SEED'` + `external_id LIKE 'SEED_POLICY_%'` 기준 멱등 관리
- `DELETE` 조건: `source='SEED' AND external_id LIKE 'SEED_POLICY_%'`
- id 범위 삭제 / TRUNCATE 금지

---

## 4. API 스펙

### GET /api/policies (인증 불필요)

| Query Param | 타입 | 설명 |
|-------------|------|------|
| keyword | string | 정책명/기관/내용 검색 |
| regionCode | string | 지역코드 (4183=양평군, 41=경기도, 0000=전국) |
| category | string | 분야 (청년농, 친환경, 스마트팜 등) |
| period | string | active=진행중, closed=마감 |
| page | int | 페이지 (0-based, 기본 0) |
| size | int | 페이지 크기 (기본 10, 최대 100) |

**응답:** `ApiResponse<PageResponse<PolicyListResponse>>`

### POST /api/admin/policies/sync (관리자용)
- 외부 소스에서 정책 수집 → DB upsert
- 현재 Mock이라 빈 목록 반환
- TODO: 운영 시 ADMIN 권한 제한 필요

---

## 5. 아키텍처 결정 사항

### 5.1 헥사고날 의존성 (검증 완료)
```
✅ domain/ → Spring 어노테이션 사용 없음 (순수 Java)
✅ application/ → adapter/ import 없음
✅ application/service/ → DTO/JPA Entity import 없음  
✅ adapter/in/ → adapter/out/ 직접 참조 없음
```

### 5.2 지역 하드코딩 제거
- 기존: Controller 내 switch문으로 regionCode→지역명 매핑
- 변경: `RegionNameResolvePort` → `RegionNameResolveAdapter` (JdbcTemplate으로 regions 테이블 직접 조회)
- gov 도메인 의존 없음 — policy 내부에서 자체 해결

### 5.3 외부 수집 클라이언트
- `Gov24PolicyClient`, `MafraPolicyClient`는 Mock (빈 목록 반환)
- 앱 기동 시 자동 호출 **없음** — `POST /api/admin/policies/sync` 수동 트리거에서만 실행
- 실 API 키 발급 후 각 클라이언트의 `fetchPolicies()` 구현 필요

### 5.4 프론트엔드 폴더 구조
- `_hooks` 폴더 사용하지 않음 — Hook 파일을 `_lib/` 하위에 배치
- `usePolicyList.ts` → `_lib/usePolicyList.ts`

### 5.5 sourceUrl 없을 때
- 카드 클릭 비활성화 (`cursor: default`, hover 효과 없음)
- "상세보기 →" 회색 + opacity 50% + `cursor: not-allowed`

---

## 6. 남은 작업 (TODO)

| 우선순위 | 작업 | 설명 |
|----------|------|------|
| 🔴 필수 | DB Seed 적용 | `seed-policy.sql` 실행하여 DDL + 15건 Seed 반영 |
| 🔴 필수 | 빌드 검증 | JDK 21 환경에서 `./gradlew clean build` + `npm run build` |
| 🟡 권장 | 지역 필터 동적화 | `POLICY_REGION_OPTIONS`를 regions API에서 동적 로딩 |
| 🟡 권장 | ADMIN 권한 적용 | `/api/admin/policies/sync` → `hasRole('ADMIN')` |
| 🟢 추후 | 외부 API 연동 | Gov24/MAFRA 실 API 키 발급 후 클라이언트 구현 |
| 🟢 추후 | data→raw_data 마이그레이션 | seed-policy.sql 내 주석 해제하여 기존 data 데이터 이전 |

---

## 7. 검증 방법

### API 테스트
```bash
# 전체 목록
curl http://localhost:8080/api/policies | jq

# 키워드 검색
curl "http://localhost:8080/api/policies?keyword=청년" | jq

# 필터 조합
curl "http://localhost:8080/api/policies?regionCode=4183&category=청년농&period=active" | jq
```

### 프론트 확인
1. http://localhost:3000/policy 접속
2. 15건 카드 표시 확인
3. 필터/검색 동작 확인
4. 상세보기 → 새 창 이동 확인
5. 빈 결과/로딩/에러 상태 확인

### 의존성 위반 검증
```bash
# domain/에 Spring 어노테이션 없는지
grep -rn "@Entity\|@Service\|@Component" backend/src/main/java/com/farmbalance/policy/domain/

# application/에서 adapter/ import 없는지  
grep -rn "import.*adapter" backend/src/main/java/com/farmbalance/policy/application/
```
