# 📑 FarmBalance — 내부 API 명세서 (Internal API Specification)

> **작성일**: 2026-04-23  
> **아키텍처**: Next.js BFF ↔ Spring Boot API Server  
> **API 컨벤션**: 
> - Base URL: `/api` (v1 생략)
> - 경로 구조: `/api/{큰_도메인(복수)}/{하부_도메인/기능(단수)}`
> - 하부 도메인이 불필요한 경우 `/api/{도메인(복수)}`로 종결

---

## 1. 공통 응답 규격

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": { "timestamp": "2026-04-23T10:40:00Z" }
}
```

---

## 2. 도메인별 API 목록

### 2.1 인증 및 유저 (Auth & Users)
| 기능 ID | 메서드 | 엔드포인트 | 권한 | 설명 |
| :--- | :---: | :--- | :---: | :--- |
| COM-001 | `POST` | `/api/auth/signup` | 🔓 | 회원가입 |
| COM-001 | `POST` | `/api/auth/verify` | 🔓 | 이메일/SMS 인증 코드 발송 및 확인 |
| COM-002 | `POST` | `/api/auth/login` | 🔓 | 로그인 (JWT 발급) |
| COM-002 | `POST` | `/api/auth/logout` | 🔑 | 로그아웃 |
| COM-003 | `GET` | `/api/users/me` | 🔑 | 내 프로필 및 역할 조회 |
| COM-003 | `PATCH` | `/api/users/me` | 🔑 | 프로필 수정 (이름, 지역, 비밀번호 등) |
| COM-003 | `DELETE` | `/api/users/me` | 🔑 | 회원 탈퇴 (상태 변경) |
| COM-004 | `GET` | `/api/notifications` | 🔑 | 내 알림 목록 조회 |
| COM-004 | `PATCH` | `/api/notifications/{id}` | 🔑 | 알림 읽음 처리 |

### 2.2 농장 및 재배 도메인 (Farms)
| 기능 ID | 메서드 | 엔드포인트 | 권한 | 설명 |
| :--- | :---: | :--- | :---: | :--- |
| FRM-001 | `POST` | `/api/farms` | 👤 | 농장 등록 신청 |
| FRM-001 | `GET` | `/api/farms` | 👤 | 내 농장 목록 조회 |
| FRM-001 | `PATCH` | `/api/farms/{id}` | 👤 | 농장 정보 수정 |
| FRM-001 | `DELETE` | `/api/farms/{id}` | 👤 | 농장 정보 삭제 |
| FRM-002 | `POST` | `/api/farms/seed` | 🌾 | 종자 구매 등록 (수급 반영) |
| FRM-002 | `DELETE` | `/api/farms/seed/{id}` | 🌾 | 종자 등록 취소 |
| FRM-003 | `POST` | `/api/farms/plan` | 🌾 | 파종 계획 등록 |
| FRM-011 | `PATCH` | `/api/farms/plan/{id}` | 🌾 | 계획 수정/취소 (수급 데이터 연동) |
| FRM-004 | `POST` | `/api/farms/harvest` | 🌾 | 수확 실적 등록 |
| FRM-010 | `GET` | `/api/farms/history` | 🌾 | 재배 통합 이력 조회 |

### 2.3 분석 및 정책 도메인 (Analysis & Policies)
| 기능 ID | 메서드 | 엔드포인트 | 권한 | 설명 |
| :--- | :---: | :--- | :---: | :--- |
| FRM-005 | `GET` | `/api/analysis/balance` | 🔑 | 수급 밸런스 실시간 데이터 |
| FRM-006 | `GET` | `/api/analysis/recommend` | 🔑 | AI 작물 추천 결과 |
| POL-001 | `GET` | `/api/policies` | 🔓 | 정책 목록 조회 (필터: keyword, regionCode, category, period, minConfidence + 페이지네이션) |
| POL-002 | `GET` | `/api/policies/{id}` | 🔓 | 정책 상세 조회 (normalizedData JSON 객체 포함) |
| POL-003 | `POST` | `/api/admin/policies/sync` | ⚙️ | Gov24 + Mock 정책 동기화 실행 (AI 분석 포함) |
| POL-004 | `DELETE` | `/api/admin/policies?source=` | ⚙️ | 소스별 정책 삭제 — `@Profile("local")` 전용 |

### 2.4 커뮤니티 도메인 (Communities)
| 기능 ID | 메서드 | 엔드포인트 | 권한 | 설명 |
| :--- | :---: | :--- | :---: | :--- |
| USR-003 | `GET` | `/api/communities/post` | 🔑 | 게시글 목록 조회 |
| USR-003 | `POST` | `/api/communities/post` | 🔑 | 게시글 작성 |
| USR-003 | `GET` | `/api/communities/post/{id}` | 🔑 | 게시글 상세 조회 |
| USR-003 | `PATCH` | `/api/communities/post/{id}` | 🔑 | 게시글 수정 |
| USR-003 | `DELETE` | `/api/communities/post/{id}` | 🔑 | 게시글 삭제 |
| USR-003 | `POST` | `/api/communities/comment` | 🔑 | 댓글 작성 및 답변 채택 |
| USR-003 | `PATCH` | `/api/communities/comment/{id}` | 🔑 | 댓글 수정 |
| USR-003 | `DELETE` | `/api/communities/comment/{id}` | 🔑 | 댓글 삭제 |

### 2.5 상점 및 외부 정보 도메인 (Shop & Stores)
| 기능 ID | 메서드 | 엔드포인트 | 권한 | 설명 |
| :--- | :---: | :--- | :---: | :--- |
| USR-002 | `GET` | `/api/shop/product` | 🔑 | 판매 상품 목록 조회 |
| USR-002 | `GET` | `/api/shop/product/{id}` | 🔑 | 상품 상세 조회 |
| USR-004 | `POST` | `/api/shop/seller` | 👤 | 판매자 상품 등록 |
| USR-004 | `PATCH` | `/api/shop/seller/{id}` | 👤 | 내 판매 상품 수정 |
| USR-004 | `DELETE` | `/api/shop/seller/{id}` | 👤 | 상품 판매 중단 |
| USR-002 | `GET` | `/api/shop/cart` | 🔑 | 내 장바구니 조회 |
| USR-002 | `POST` | `/api/shop/cart` | 🔑 | 장바구니 담기 |
| USR-002 | `PATCH` | `/api/shop/cart/{id}` | 🔑 | 장바구니 수량 수정 |
| USR-002 | `DELETE` | `/api/shop/cart/{id}` | 🔑 | 장바구니 항목 삭제 |
| USR-002 | `GET` | `/api/shop/order` | 🔑 | 내 주문 내역 조회 |
| USR-002 | `POST` | `/api/shop/order` | 🔑 | 주문 생성 및 결제 |
| USR-005 | `GET` | `/api/shop/seller/order` | 👤 | 판매자 주문 관리 목록 |
| USR-005 | `PATCH` | `/api/shop/seller/order/{id}` | 👤 | 주문 상태 변경 (발송 등) |
| FRM-007 | `GET` | `/api/stores` | 🔑 | 주변 농기구/협력 가게 조회 |

### 2.6 지자체 및 관리자 도메인 (Govs & Admins)
| 기능 ID | 메서드 | 엔드포인트 | 권한 | 설명 |
| :--- | :---: | :--- | :---: | :--- |
| GOV-001 | `GET` | `/api/govs/dashboard` | 🏛️ | 수급 모니터링 대시보드 |
| GOV-003 | `GET` | `/api/govs/stat` | 🏛️ | 상세 재배 현황 통계 |
| GOV-002 | `GET` | `/api/govs/comparison` | 🏛️ | 지역별 비교 분석 |
| GOV-004 | `POST` | `/api/govs/report` | 🏛️ | 분석 보고서(PDF) 생성 요청 |
| GOV-005 | `POST` | `/api/govs/notice` | 🏛️ | 농가 대상 권고 발송 |
| GOV-006 | `GET` | `/api/gov/download` | 🏛️ | 지자체 데이터 다운로드 (엑셀/CSV) |
| GOV-006 | `GET` | `/api/gov/download/history` | 🏛️ | 데이터 다운로드 이력 최근 조회 |
| ADM-011 | `GET` | `/api/admins/dashboard` | ⚙️ | 관리자 전체 통계 |
| ADM-001 | `GET` | `/api/admins/user` | ⚙️ | 전체 사용자 관리 |
| ADM-001 | `PATCH` | `/api/admins/user/{id}` | ⚙️ | 사용자 역할/상태 변경 |
| ADM-002 | `PATCH` | `/api/admins/approval` | ⚙️ | 농부 승인 처리 |
| ADM-003 | `GET` | `/api/admins/crop` | ⚙️ | 작물 마스터 조회 |
| ADM-003 | `POST` | `/api/admins/crop` | ⚙️ | 작물 마스터 등록 |
| ADM-003 | `PATCH` | `/api/admins/crop/{id}` | ⚙️ | 작물 정보 수정 |
| ADM-012 | `POST` | `/api/admin/policies/sync` | ⚙️ | 정책 동기화 (Gov24 API + AI 분석) — POL-003 참조 |
| ADM-010 | `GET/POST` | `/api/admins/store` | ⚙️ | 가게 데이터 조회/등록 |
| ADM-005 | `PATCH` | `/api/admins/engine` | ⚙️ | 수급 엔진 설정 변경 |
| ADM-009 | `PATCH` | `/api/admins/shop` | ⚙️ | 상점 상품 승인/관리 |
| ADM-004 | `PATCH` | `/api/admins/data` | ⚙️ | 외부 API 동기화 설정 |
| ADM-006 | `GET` | `/api/admins/health` | ⚙️ | 시스템 헬스 모니터링 |

---

## 3. 권한(Role) 정의
- 🔓 **Public**: 비로그인 접근 가능
- 🔑 **Authenticated**: 로그인 사용자 전체
- 👤 **General/Farmer**: 일반 유저 및 농부
- 🌾 **Farmer Only**: 승인된 농부
- 🏛️ **Gov Only**: 지자체 담당자
- ⚙️ **Admin Only**: 시스템 관리자
