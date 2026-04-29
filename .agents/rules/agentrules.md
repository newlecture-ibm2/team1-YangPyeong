---
trigger: always_on
---

# 🧑‍💻 FarmBalance 개발 에이전트 규칙 (AGENT_RULES)

이 문서는 FarmBalance 프로젝트 개발 시 에이전트가 준수해야 할 표준과 원칙을 정의합니다.
모든 코드 생성, 리팩토링, 리뷰 시 반드시 이 규칙을 따릅니다.

---

## 1. 개발 원칙

- **핵심 유저**: 농업인(고령층 포함), 지자체 담당자, 시스템 관리자.
- **최우선 가치**: UI/UX 접근성(사용 편의성), 정확한 수급 데이터 관리, 간편한 등록 프로세스 구현.
- **언어**: 사용자 소통 및 코드 주석은 **한국어**, 코드(변수명, 클래스명, 폴더명)는 **영어**를 사용합니다.

### 필수 참조 문서 (MUST READ before coding)

에이전트는 작업 전 해당 영역의 문서를 **반드시 먼저 읽고** 작업합니다.

| 작업 영역 | 참조 문서 |
|-----------|-----------|
| **전체 기획/비즈니스 로직** | `docs/project-spec.md` |
| **폴더 구조/아키텍처** | `docs/architecture/folder-structure.md` |
| **AI 서버 상세** | `docs/architecture/ai-architecture.md` |
| **DB 설계** | `docs/architecture/ERD.md` |
| **내부 API 스펙** | `docs/architecture/api-spec.md` |
| **외부 API 연동** | `docs/architecture/external-api/` 폴더 내 해당 문서 |
| **화면 목록/IA** | `docs/ui-design/screen-list.md` |
| **디자인 토큰/글로벌 스타일** | `frontend/app/globals.css` |
| **공통 UI 컴포넌트** | `frontend/components/common/` |
| **컴포넌트 사용 예시** | `frontend/app/components-demo/page.tsx` |
| **페이지 디자인 목업** | `docs/ui-design/mockups/final-ui-mockup/` |

---

## 2. 백엔드 개발 표준 (Java / Spring Boot)

### 2.1 기술 스택
- Java 21, Spring Boot 3.3.x, Spring Data JPA (Hibernate), Gradle (Groovy).

### 2.2 헥사고날 아키텍처 (MUST FOLLOW)

**모든 도메인은 아래 패키지 구조를 엄격히 따릅니다.**

```
com.farmbalance.{도메인}/
├── adapter/
│   ├── in/web/            ← Driving Adapter (Controller + DTO)
│   │   └── dto/
│   └── out/persistence/   ← Driven Adapter (JPA Entity + Repository + Adapter)
│       ├── entity/
│       └── repository/
├── application/
│   ├── port/
│   │   ├── in/            ← Input Port (UseCase 인터페이스)
│   │   └── out/           ← Output Port (Repository 인터페이스)
│   └── service/           ← UseCase 구현체
└── domain/                ← 순수 비즈니스 로직 (POJO)
```

### 2.3 의존성 규칙 (DO NOT VIOLATE)

| 규칙 | 설명 |
|------|------|
| ✅ `domain/` → 어디에도 의존 X | 순수 Java. Spring 어노테이션(@Entity 등) 사용 금지 |
| ✅ `application/` → `domain/`만 의존 | UseCase + Port 정의 |
| ✅ `adapter/` → `application/` + `domain/` 의존 | 프레임워크 의존 허용 |
| ❌ `domain/` → `application/` | **DO NOT** — 의존 금지 |
| ❌ `application/` → `adapter/` | **DO NOT** — 의존 금지 |
| ❌ `adapter/in/` → `adapter/out/` | **DO NOT** — 어댑터 간 직접 참조 금지 |

### 2.4 도메인 목록

| 도메인 | 패키지 | 특이사항 |
|--------|--------|----------|
| user | `com.farmbalance.user` | 인증/인가 |
| farm | `com.farmbalance.farm` | 농장 라이프사이클 전체 |
| crop | `com.farmbalance.crop` | 작물 마스터 데이터 |
| balance | `com.farmbalance.balance` | 수급 계산 엔진 |
| shop | `com.farmbalance.shop` | 상점 |
| community | `com.farmbalance.community` | 게시판 |
| policy | `com.farmbalance.policy` | `adapter/out/external/` 포함 (AI API 호출) |
| store | `com.farmbalance.store` | 가게 정보 (DB 엔티티 없음, Kakao 연동) |
| admin | `com.farmbalance.admin` | 관리 기능 |

### 2.5 API 설계 규칙
- **응답 표준**: `ApiResponse<T>` 공통 래퍼 사용. 필드명은 `camelCase`, URL은 `kebab-case`.
- **에러 코드**: `E-[역할]-[기능]-[번호]` 형식 (예: `E-FM-SEED-001`).
- **추적**: 모든 요청/로그에 `X-Correlation-Id` 포함.

### 2.6 에러 핸들링 패턴 (MUST FOLLOW)

```java
// 1. 커스텀 예외는 반드시 BusinessException을 상속
public class FarmNotFoundException extends BusinessException {
    public FarmNotFoundException() {
        super(ErrorCode.FARM_NOT_FOUND);
    }
}

// 2. Service에서 예외 발생 → GlobalExceptionHandler가 자동 처리
// DO NOT — Controller에서 직접 try-catch 하지 않는다
```

- 모든 예외는 `global/error/BusinessException.java`를 상속합니다.
- 에러 코드는 `global/error/ErrorCode.java` enum에 정의합니다.
- `GlobalExceptionHandler`가 `@RestControllerAdvice`로 일괄 처리합니다.

### 2.7 DTO ↔ Domain ↔ Entity 변환 규칙

```
[Controller]         [Service]            [PersistenceAdapter]
Request DTO ──→ Domain 객체 ──→ JPA Entity
                     ↑                         │
Response DTO ←── Domain 객체 ←── JPA Entity
```

| 변환 위치 | 변환 내용 | 담당 |
|-----------|-----------|------|
| `adapter/in/web/` | Request DTO → Domain | Controller 또는 별도 Mapper |
| `adapter/in/web/` | Domain → Response DTO | Controller 또는 별도 Mapper |
| `adapter/out/persistence/` | Domain → JPA Entity | PersistenceAdapter |
| `adapter/out/persistence/` | JPA Entity → Domain | PersistenceAdapter |

> **DO NOT** — Service(application/)에서 DTO나 JPA Entity를 직접 다루지 않습니다. Service는 오직 Domain 객체만 사용합니다.

### 2.8 테스트 작성 규칙

| 대상 | 테스트 유형 | 위치 |
|------|-----------|------|
| `domain/` | 단위 테스트 (JUnit 5) | `src/test/java/.../domain/` |
| `application/service/` | 단위 테스트 (Mockito) | `src/test/java/.../application/service/` |
| `adapter/in/web/` | 통합 테스트 (@WebMvcTest) | `src/test/java/.../adapter/in/web/` |
| `adapter/out/persistence/` | 슬라이스 테스트 (@DataJpaTest) | `src/test/java/.../adapter/out/persistence/` |

- 테스트 클래스명: `{원본클래스}Test.java` (예: `AuthServiceTest.java`)
- Service 테스트 시 Port는 **Mockito로 모킹**, Domain은 실제 객체 사용.

---

## 3. 프런트엔드 개발 표준 (Next.js)

### 3.1 기술 스택
- Next.js 15 (App Router), React 19, TypeScript 5.
- **스타일링**: Vanilla CSS + CSS Modules (`.module.css`). TailwindCSS 사용 금지.

### 3.2 TypeScript 규칙

```typescript
// DO NOT — any 사용 금지
const data: any = response;  // ❌

// DO — 명시적 타입 정의
const data: FarmResponse = response;  // ✅

// DO — 모든 API 응답, Props에 타입 정의 필수
interface FarmCardProps {
  farm: Farm;
  onSelect: (id: number) => void;
}
```

- `any` 타입 사용 금지. 불가피한 경우 `unknown` + 타입 가드 사용.
- 모든 컴포넌트 Props에 `interface` 정의 필수.
- 타입 파일은 `_lib/{도메인}.types.ts`에 정의.

### 3.3 BFF 패턴 (MUST FOLLOW)
- `httpOnly` 쿠키로 JWT 관리. 클라이언트에 토큰 직접 노출 금지.
- 모든 백엔드 API 호출은 `app/api/` Route Handler를 통해 프록시.

### 3.4 코로케이션 (Co-location) 규칙 (MUST FOLLOW)

**한 기능에 필요한 모든 파일을 해당 라우트 폴더 안에 배치합니다.**

```
app/(main)/farm/
├── page.tsx              ← 페이지
├── _hooks/               ← 도메인 전용 Hook (라우트 제외)
├── _lib/                 ← API 호출 + 타입 정의 (라우트 제외)
├── _components/          ← 도메인 전용 UI (라우트 제외)
├── register/page.tsx     ← 하위 라우트
└── seed/
    ├── page.tsx
    └── _hooks/           ← seed 전용 Hook
```

### 3.5 폴더 네이밍 규칙

| 문법 | 역할 | 예시 |
|------|------|------|
| `_폴더명` | **비공개 폴더** (라우트 제외) | `_hooks/`, `_lib/`, `_components/` |
| `(그룹명)` | **라우트 그룹** (URL 미포함) | `(auth)/`, `(main)/` |
| `[param]` | **동적 라우트** | `[cropCode]/`, `[postId]/` |

### 3.6 참조 규칙 (DO NOT VIOLATE)

```
✅ 상위 도메인의 _hooks/ 참조 가능   → import from '../_hooks/useFarm'
✅ 자기 도메인의 _hooks/ 참조 가능   → import from './_hooks/useSeedForm'
✅ 공유 컴포넌트 참조 가능           → import from '@/components/common/Button'
❌ 다른 도메인의 _hooks/ 직접 참조 금지 → DO NOT import from '../../shop/_hooks/useShop'
```

> 다른 도메인의 데이터가 필요하면 **API를 통해 조회**하거나 **공유 `lib/`로 이동**합니다.

### 3.7 UI 접근성 (중요 지침)
- **가독성**: 고령 농업인 배려 — 최소 글꼴 크기 **16px**.
- **터치 영역**: 최소 **44px** 이상.

### 3.8 디자인 참조 (MUST FOLLOW)

새 페이지나 컴포넌트를 만들 때 반드시 아래 두 곳을 **먼저 참조**합니다.

| 참조 대상 | 경로 | 역할 |
|-----------|------|------|
| **디자인 토큰 + 글로벌 스타일** | `app/globals.css` | CSS 변수(`--color-*`, `--radius-*`, `--space-*` 등) 정의 |
| **공통 컴포넌트 구현** | `components/common/` | Button, Badge, Card, Input, Modal, Dropdown, SearchInput, FilterBar, Toast 등 |
| **공통 컴포넌트 사용 예시** | `app/components-demo/page.tsx` | 각 컴포넌트의 올바른 props, variant, 조합 패턴 데모 |
| **페이지 디자인 목업** | `docs/ui-design/mockups/final-ui-mockup/` | 도메인별(admin, farm, shop 등) 최종 UI 디자인 HTML 목업 |

**페이지 구현 전 참조 순서:**
1. `components/common/` + `components-demo/page.tsx`로 사용 가능한 공통 컴포넌트 확인
2. `final-ui-mockup/{도메인}/` 해당 페이지의 디자인 목업을 먼저 확인
3. `globals.css`의 디자인 토큰으로 CSS Module 작성

> **우선순위 규칙**: `components/common/`의 컴포넌트 CSS와 `globals.css`의 색상이 **충돌하는 경우**, 공통 컴포넌트의 색상/스타일을 우선합니다.
> `globals.css`는 공통 컴포넌트에 정의되지 않은 값(간격, 폰트, 테두리, 레이아웃 토큰 등)을 참조할 때 사용합니다.

> [!WARNING]
> `final-ui-mockup/`은 **디자인(CSS/레이아웃/스타일) 참고용**입니다. 기능·콘텐츠 스펙이 **아닙니다.**
> 목업에 없는 기능이라도 이미 구현된 기능을 **절대 제거하지 않습니다.**
> 목업은 시각적 스타일(간격, 색상, 카드 구조, 탭 형태 등)만 참고하고, 페이지의 기능·데이터 표시 항목은 기존 구현을 유지합니다.

```
✅ CSS Module 작성 시 globals.css의 디자인 토큰 사용  → color: var(--color-text);
✅ 컴포넌트 사용 전 components-demo 참조             → <Badge variant="green">
✅ 공통 컴포넌트로 해결 가능하면 직접 HTML 작성 금지    → <Dropdown> 사용 (not <select>)
❌ 하드코딩 색상값 사용 금지                          → DO NOT color: #2D6A4F (use var())
```

---

## 4. 네이밍 컨벤션 총정리

| 대상 | 규칙 | 예시 |
|------|------|------|
| **폴더 (docs/, frontend/)** | kebab-case | `external-api/`, `_hooks/` |
| **Java 클래스** | PascalCase | `AuthService`, `UserJpaEntity` |
| **Java 패키지** | 소문자 | `com.farmbalance.user` |
| **TypeScript 파일** | camelCase | `useFarm.ts`, `farm.api.ts` |
| **React 컴포넌트** | PascalCase | `FarmCard.tsx` |
| **CSS Module** | PascalCase.module.css | `FarmCard.module.css` |
| **Python 파일** | snake_case | `recommend_service.py` |
| **API URL** | kebab-case | `/api/farm/seed-registration` |
| **JSON 필드** | camelCase | `cropName`, `totalScore` |

---

## 5. 작업 프로세스 및 Git 규칙

- **푸시 (Push) 권한**: 사용자가 명시적으로 푸시(Push)를 요청하기 전까지는 **절대 에이전트가 임의로 원격 저장소에 푸시하지 않습니다.**
- **커밋 메시지**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).
- **브랜치**: `main` (배포), `dev` (개발).
- **환경 구축**: Docker Compose v2로 로컬 환경 동기화.
- **.gitkeep 관리**: 빈 폴더를 유지하기 위해 생성한 `.gitkeep` 파일은 해당 폴더에 실제 파일이 생성되면 **반드시 삭제**합니다.

---

## 6. 금지 사항 (DO NOT)

| # | 금지 사항 |
|:-:|-----------|
| 1 | `domain/`에 Spring 어노테이션(`@Entity`, `@Service` 등) 사용 금지 |
| 2 | `application/`에서 `adapter/` 직접 import 금지 |
| 3 | `application/service/`에서 DTO, JPA Entity 직접 사용 금지 (Domain만 사용) |
| 4 | Frontend에서 다른 도메인의 `_hooks/` 직접 참조 금지 |
| 5 | 클라이언트 사이드에서 JWT 토큰 직접 접근 금지 (BFF 경유 필수) |
| 6 | TailwindCSS 사용 금지 (Vanilla CSS + CSS Modules만 사용) |
| 7 | TypeScript에서 `any` 타입 사용 금지 (`unknown` + 타입 가드 또는 명시적 타입) |
| 8 | `docs/` 내 최종 문서의 한국어 폴더명 사용 금지 (영어 kebab-case) |
| 9 | AI `llm/` 모듈에서 특정 Provider 하드코딩 금지 (`BaseLLM` 추상화 사용) |
| 10 | Controller에서 직접 try-catch 금지 (GlobalExceptionHandler 사용) |
