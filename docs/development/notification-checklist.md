# 📋 알림 시스템 — 개발 체크리스트 및 역할별 가이드

> 기준 문서: `docs/architecture/notification-architecture.md`
> 최종 갱신: 2026-05-12

---

## 👥 역할별 알림 수신 요약

### 🌾 농업인 (FARMER / USER)
**가장 많은 알림을 수신하는 메인 타겟입니다.**
- [x] 수급 과잉경고/주의 (내가 재배 중인 작물) - `BALANCE_WARN`
- [x] 수급 부족주의/경고 (전체 농부 대상) - `BALANCE_WARN`
- [x] 작물 등록 시 정책 매칭 안내 - `POLICY`
- [x] 농장 승인/반려 - `SYSTEM`
- [x] 주문 상태 변경 (내가 구매한 상품) - `ORDER`
- [x] 새 주문 접수 (내가 판매한 상품) - `ORDER`
- [x] 내 게시글에 댓글 - `SYSTEM`

### 🏛️ 지자체 (GOV)
**수급 이상을 모니터링하고, 필요시 농업인에게 권고를 발송하는 주체입니다.**
- [x] 수급 과잉경고/주의/부족주의/경고 (관할 지역 전체) - `BALANCE_WARN`

### 🔧 관리자 (ADMIN)
**대시보드 중심의 확인으로, 별도의 푸시 알림 수신은 최소화합니다.**
- (현재 지정된 필수 수신 알림 없음)

---

## 🚀 개발 진행 현황 요약

| 구분 | 완료 | 미완료 |
|------|:----:|:------:|
| 인프라/기반 | 15건 | 0건 |
| FCM 트리거 | 7건 | 0건 |
| 페이지 Toast | 부분 | 13건 정의됨 |

---

## P0 — 핵심 기반 (구현 완료 ✅)

### 인프라/UI
- [x] 백엔드 notification 도메인 (헥사고날 21개 파일)
- [x] fcm_tokens 테이블 + Flyway 마이그레이션 (V34)
- [x] Firebase Admin SDK 초기화 (FirebaseConfig)
- [x] 프론트 Firebase 초기화 + Service Worker
- [x] FCM Hook (useFCM.ts) → Header에서 호출
- [x] BFF Route Handler 6개 (알림 4 + FCM 토큰 2)
- [x] 알림 목록 페이지 (/mypage/notifications)
- [x] 헤더 🔔 벨 아이콘 + 안읽은 알림 수 뱃지
- [x] 로그아웃 시 FCM 토큰 삭제 (Header.tsx + useFCM.ts)
- [x] FCM 토큰 만료 자동 정리 (FcmNotificationService)

### FCM 트리거 (일부 완료)
- [x] 수급 비율 임계값 알림 (BALANCE_WARN) — 5단계 분기 + 타겟팅
- [x] 작물 등록 시 정책 매칭 안내 (POLICY)
- [x] 농장 승인/반려 알림 (SYSTEM) — FarmApprovalService에서 발송

---

## P1 — 상점 연동 (상점 기능 활성화 시 필요)

- [x] **주문 상태 변경 알림 (ORDER)** — 셀러가 발송 처리 시 구매자에게 FCM
- [x] **새 주문 접수 알림 (ORDER)** — 구매자가 주문 시 셀러에게 FCM

---

## P2 — 부가 기능 (사용자 경험 향상)

- [x] **댓글/답변 알림 (SYSTEM)** — 내 게시글에 댓글 달리면 작성자에게 FCM
- [x] **AI 추천 결과 완료 알림 (SYSTEM)** — 비동기 AI 추천 완료 시 요청자에게 FCM

---

## 🍞 페이지 Toast 알림 (DB 저장 없이 화면 피드백만)

> 기존 Toast 컴포넌트(`components/common/Toast/`) 활용

- [x] 주문/결제 완료 (`/shop/checkout`)
- [x] 주문 상태 변경 - 셀러 (`/shop/seller/orders`)
- [x] 게시글 등록 (`/community`)
- [x] 댓글 등록 (`/community/[id]`)
- [x] AI 추천 완료 (`/recommend`)
- [ ] 공문 PDF 생성 (`/policy`)
- [ ] 보고서 생성 - 지자체 (`/gov/reports`)
