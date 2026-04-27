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

> 📌 **주의사항**: 로컬 개발 시 `.env` 파일의 `JWT_SECRET`과 `DB_PASSWORD`가 노출되지 않도록 주의하며, 모든 API 응답은 `ApiResponse<T>` 표준 형식을 준수합니다.
