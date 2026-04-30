# 🏠 집에서 이어할 작업 목록

> **현재 상태**: `dev-sookyung` 브랜치, stage merge 완료 (커밋 `cec15b3`)
> **날짜**: 2026-04-30

---

## 🔴 1순위: stage 병합 후 빌드 확인

stage에서 shop, history, Flyway 마이그레이션 등 대량 코드가 들어왔다.
병합 후 빌드가 깨질 수 있으므로 **가장 먼저 확인**.

```bash
cd backend && ./gradlew clean build
```

> [!WARNING]
> Flyway 마이그레이션 파일(`V1~V8`)이 새로 들어왔다.
> 기존 Hibernate `ddl-auto: update` 방식과 충돌할 수 있으므로
> `application.yml`의 `spring.jpa.hibernate.ddl-auto` 설정 확인 필요.

---

## 🔴 2순위: PR 전 최종 테스트 (중단된 테스트 이어서)

오늘 아래 7단계 중 **4단계 Sync 테스트 도중 중단**됨.

| # | 테스트 | 상태 |
|:-:|--------|------|
| 1 | `./gradlew clean build` | ✅ 통과 |
| 2 | AI 서버 health/detail | ✅ 통과 |
| 3 | Policy Analyzer 3건 | ✅ 통과 |
| 4 | **Policy Sync (POST /api/admin/policies/sync)** | ⏸️ 실행 중 중단 |
| 5 | 정책 목록/상세 API | ❌ 미실행 |
| 6 | 프론트 빌드/lint + 화면 확인 | ❌ 미실행 |
| 7 | 보안/안전성 grep 검색 | ❌ 미실행 |

### 4번: Sync 테스트 재실행

```bash
# 백엔드 기동 (Mock ON으로 skip 테스트 포함)
cd backend
./gradlew bootRun --args='--app.policy.mock-fetcher-enabled=true --gov24.api-key=${GOV24_API_KEY}'

# Sync 실행
curl -s -X POST http://localhost:8080/api/admin/policies/sync | python3 -m json.tool
```

**확인 항목:**
- `fetched > 0`
- `skipped >= 1` (MOCK_SKIP_007)
- `analyzed < fetched`
- 전체 sync 중단 없이 응답 수신

### 5번: 정책 API 테스트

```bash
# 목록
curl -s 'http://localhost:8080/api/policies?page=0&size=5' | python3 -m json.tool

# 상세 (id는 목록에서 확인)
curl -s 'http://localhost:8080/api/policies/1' | python3 -m json.tool
```

**확인 항목:**
- `normalizedData`가 JSON **객체** (문자열 아님)
- `isAnalyzed`, `isLowConfidence` 필드 존재
- `sourceUrl`이 `https://www.gov.kr/...` 형태

### 6번: 프론트 테스트

```bash
cd frontend
npm run build
npm run lint
npm run dev
```

**화면 확인 (localhost:3000/policy):**
- 정책 카드 목록 표시
- 필터(지역/분야/기간) 동작
- 상세보기 → 실제 정부24 사이트 이동
- SEED 데이터 없음 확인 (Mock OFF 기동 시)

### 7번: 보안/안전성 검색

```bash
grep -rn "TRUNCATE" backend/src/main/
grep -rn "MOCK_SKIP" backend/src/main/
grep -rn "GOV24_API_KEY=" .
grep -rn "GEMINI_API_KEY=" .
grep -rn "farmbalance1234" .
```

**확인:** 실제 키/비밀번호가 코드/문서에 하드코딩되지 않았는지.

---

## 🟡 3순위: PR 작성 + 푸시

테스트 전부 통과 후:

```bash
git push origin dev-sookyung
```

GitHub에서 `dev-sookyung` → `stage` PR 생성.

**PR 제목 예시:**
```
feat: 정책 시스템 Gov24 실제 API 연동 + AI 분석 파이프라인 완성
```

**PR 본문 포함 항목:**
- Gov24 API 연동 (28건 수집, 26건 저장)
- MockFetcher 기본 비활성화 (`matchIfMissing=false`)
- DELETE API `@Profile("local")` 분리
- AI 분석 → DB 저장 → 프론트 표시 E2E 검증 완료

---

## 📋 참고: 로컬 기동 명령어

### 백엔드 (Gov24 실제 모드)
```bash
cd backend
SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5151/farm_db" \
SPRING_DATASOURCE_USERNAME=farm \
SPRING_DATASOURCE_PASSWORD='farmbalance1234!' \
JWT_SECRET=58d1763a911513499b54ecd11afd4446ec374a14a12aeced0f936d6105376c9042ca1f04594fd7741a425c1e29d43b1a42d94949fef35a9acf94c4477dce28e5 \
AI_SERVER_URL=http://localhost:8000 \
./gradlew bootRun --args='--gov24.api-key=${GOV24_API_KEY}'
```

### AI 서버
```bash
cd ai
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 프론트
```bash
cd frontend
npm run dev
```

---

## ⚠️ 주의사항

1. **stage 병합으로 Flyway가 추가됨** → `ddl-auto` 설정이 `update`면 충돌 가능
2. **DB에 현재 SEED 7건 + GOV24 26건 혼재** → Mock OFF 기동 후 `DELETE /api/admin/policies?source=SEED` 호출하려면 `--spring.profiles.active=local` 필요
3. **GOV24_API_KEY는 `.env.local`에만 존재** → 코드에 절대 하드코딩 금지
