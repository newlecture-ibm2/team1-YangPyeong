# 🛠️ FarmBalance 구현 가이드: 백엔드 & 프론트엔드 통합 전략

이 문서는 FarmBalance 프로젝트의 기술 스택인 **Spring Boot (헥사고날)**와 **Next.js (BFF)**를 기반으로 한 상세 구현 방안을 정의합니다.

---

## 1. 백엔드 구현 (Spring Boot 3.3 + 헥사고날)

백엔드는 비즈니스 로직이 외부 기술(DB, API 등)에 의존하지 않도록 헥사고날 아키텍처를 따릅니다.

### 📂 패키지 구조
```text
com.farmbalance.backend
├── domain/                # 순수 비즈니스 로직 및 엔티티 (Framework 의존성 없음)
├── application/           # 유즈케이스 정의 및 서비스 구현
│   ├── port/              # 인/아웃바운드 인터페이스
│   └── service/           # 도메인 모델을 호출하는 서비스
└── adapter/               # 외부 기술과의 연결
    ├── in/                # Web Controller (REST API)
    └── out/               # Persistence (JPA), External API (KMA, Kakao)
```

### 🔐 보안 핵심 구현 (Security)
1. **비밀번호 해싱**: `BCryptPasswordEncoder`를 사용하여 DB 저장 전 해싱 처리합니다.
2. **JWT 발급**: 로그인 성공 시 `HS256` 알고리즘을 사용하여 Access Token과 Refresh Token을 생성합니다.
3. **Spring Security**: 
   - JWT 필터를 통해 모든 요청의 헤더에서 토큰을 검증합니다.
   - 무상태(Stateless) 세션 정책을 유지합니다.

---

## 2. 프론트엔드 구현 (Next.js 15 + BFF)

프론트엔드는 사용자 경험(UX)과 보안을 동시에 잡기 위해 BFF(Backend For Frontend) 패턴을 적용합니다.

### 🛡️ BFF 및 세션 보안 관리
Next.js 서버가 백엔드와의 통신을 중계하며 보안을 강화합니다.

1. **API 라우트 (`app/api/*`)**:
   - 브라우저의 요청을 백엔드 서버로 프록시(Proxy)합니다.
   - 백엔드 주소를 외부로 노출하지 않습니다.
2. **Encrypted httpOnly Cookie**:
   - 백엔드에서 받은 JWT를 그대로 저장하지 않고, Next.js 서버에서 한 번 더 **암호화**하여 쿠키에 굽습니다.
   - `httpOnly` 속성을 부여하여 클라이언트 사이드 자바스크립트 접근을 원천 차단합니다.
3. **토큰 교환 로직**:
   - 브라우저 → Next.js (쿠키 전송)
   - Next.js (쿠키 복호화 → JWT 추출) → Spring Boot (Header에 JWT 첨부)

### 🎨 스타일링 및 UI
- **Vanilla CSS Modules**: `.module.css` 파일을 사용하여 클래스 네임 충돌을 방지하고 가볍고 빠른 스타일링을 구현합니다.
- **Responsive Design**: 모바일 사용자가 많은 농업 특성을 고려하여 `320px`부터 대응하는 유연한 레이아웃을 제공합니다.

---

## 3. 통합 인증 시퀀스 흐름

### [Step 1: 로그인]
1. `Browser`: ID/PW를 Next.js API Route로 전송
2. `Next.js`: Spring Boot의 `/api/auth/login` 호출
3. `Spring`: 비밀번호 검증 후 JWT 응답
4. `Next.js`: JWT를 세션 라이브러리(`iron-session` 등)로 암호화하여 `Set-Cookie` 헤더와 함께 응답

### [Step 2: API 요청]
1. `Browser`: Next.js 서버로 API 요청 (쿠키 자동 포함)
2. `Next.js`: 쿠키 내부의 JWT를 복호화
3. `Next.js`: Spring Boot로 요청을 보낼 때 헤더에 `Authorization: Bearer <JWT>` 추가
4. `Spring`: 토큰 검증 후 데이터 반환

---

## 4. 데이터 정합성 및 캐싱
- **Redis**: 
  - 인증 세션 관리 및 외부 API(날씨, 토양) 데이터 캐싱
  - API 호출 횟수 제한(Rate Limiting) 적용
- **PostgreSQL**: 
  - 핵심 비즈니스 데이터 및 이력 관리

---

## 5. 구현 시 주의사항 및 해결 방안

실제 구현 시 발생할 수 있는 기술적 리스크와 이에 대한 대응 방안입니다.

### 5.1 쿠키 크기 제한 (Cookie Size Limit)
- **리스크**: JWT에 너무 많은 클레임(Claim)을 담고 암호화하면 브라우저의 쿠키 제한(4KB)을 초과할 수 있습니다.
- **해결책**: JWT에는 유저 ID, 권한 등 최소한의 식별 정보만 담고, 상세 프로필은 서버 사이드에서 캐시(Redis)나 DB를 통해 조회합니다.

### 5.2 토큰 갱신 전략 (Refresh Token)
- **리스크**: Access Token 만료 시 BFF에서 이를 감지하고 재발급받는 로직이 누락되면 사용자가 예기치 않게 로그아웃될 수 있습니다.
- **해결책**: Next.js Middleware 또는 API Route에서 토큰 만료를 체크하고, 필요 시 Refresh Token으로 자동 갱신(Silent Refresh)하는 로직을 구현합니다.

### 5.3 환경 변수 및 보안 키 동기화
- **리스크**: Spring Boot의 JWT 서명 키와 Next.js의 쿠키 암호화 키가 혼용되거나 유출될 수 있습니다.
- **해결책**: `.env` 파일에서 각 서버의 Secret Key를 명확히 분리하여 관리하고, 배포 시에는 AWS Secrets Manager 등을 활용합니다.

### 5.4 서버 컴포넌트(SSR) 인증 처리
- **리스크**: Next.js 서버 컴포넌트에서 백엔드 API를 호출할 때 브라우저의 쿠키가 자동으로 전달되지 않아 인증 오류가 발생할 수 있습니다.
- **해결책**: `headers()`를 사용하여 클라이언트의 쿠키를 수동으로 추출한 뒤, 백엔드 요청 헤더에 Bearer 토큰으로 포함시켜야 합니다.

### 5.5 에러 매핑 및 사용자 피드백
- **리스크**: 백엔드의 401/403 에러가 BFF를 거치며 일반 500 에러로 변질되어 사용자에게 모호한 메시지를 줄 수 있습니다.
- **해결책**: BFF layer에서 백엔드 응답 코드를 분석하여, 적절한 프론트엔드 경로(예: `/login`)로 리다이렉트하거나 전용 에러 메시지를 반환합니다.
