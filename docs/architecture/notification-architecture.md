# 🔔 알림 시스템 아키텍처 — 구현 현황 + 확장 계획

> **최종 갱신**: 2026-05-12  
> **관련 스펙**: `project-spec.md` COM-004, GOV-005, 4.4절

---

## 1. 구현 현황 요약

### ✅ 완료된 항목

| 구분 | 항목 | 비고 |
|------|------|------|
| DB | `notifications` 테이블 (V1) | type, title, message, link, is_read |
| DB | `fcm_tokens` 테이블 (V34) | user_id, token, device_type |
| 백엔드 | `notification` 도메인 패키지 (헥사고날 21개 파일) | Domain → Port → Adapter |
| 백엔드 | Firebase Admin SDK 초기화 (`FirebaseConfig`) | `firebase-adminsdk.json` |
| 백엔드 | 알림 CRUD API 4개 + FCM 토큰 API 2개 | 전체 목록은 §6 참조 |
| 백엔드 | 수급 임계값 5단계 분기 알림 (`BalanceEventListener`) | §4 참조 |
| 백엔드 | 정책 매칭 알림 (`CultivationEventListener`) | 작물 등록 시 POLICY 타입 |
| 프론트 | Firebase 초기화 + 토큰 발급 (`lib/firebase.ts`) | VAPID Key |
| 프론트 | Service Worker (`firebase-messaging-sw.js`) | 백그라운드 푸시 수신 |
| 프론트 | FCM Hook (`useFCM.ts`) → Header에서 호출 | 로그인 시 자동 등록 |
| 프론트 | BFF Route Handler 6개 | JWT 쿠키 프록시 |
| 프론트 | 알림 목록 페이지 (`/mypage/notifications`) | 필터 + 페이징 |

### ⚠️ 미완료 항목

| # | 항목 | 설명 |
|:-:|------|------|
| 1 | 헤더 🔔 벨 뱃지 UI | unread-count API는 준비됨, Header UI 미노출 |
| 2 | FCM 토큰 만료 자동 삭제 | `Unregistered` 예외 시 DB 정리 로직 TODO |
| 3 | 로그아웃 시 토큰 삭제 연동 | `DELETE /api/fcm/tokens` 호출 필요 |

---

## 2. 전체 데이터 흐름

```
[비즈니스 이벤트 발생]
   ├─ 작물 등록/수정 → CultivationChangedEvent
   ├─ 수확 완료 → HarvestRecordedEvent
   ├─ 주문 상태 변경 → (미구현)
   └─ 지자체 권고 발송 → (미구현)
       │
       ▼
[이벤트 리스너] (비동기 @Async)
   ├─ BalanceEventListener → 수급 비율 재계산
   └─ CultivationEventListener → AI 예측 + 정책 매칭
       │
       ▼
[NotificationService] (핵심 서비스)
   ├─ ① notifications 테이블에 DB 저장
   └─ ② FcmNotificationService → Firebase SDK → 디바이스 푸시
       │
       ▼
[사용자 수신]
   ├─ 포그라운드: onMessage → Toast/벨 뱃지 갱신
   └─ 백그라운드: Service Worker → 브라우저 푸시 → 클릭 시 해당 페이지 이동
```

---

## 3. 알림 유형 정의

| NotificationType | 용도 | 아이콘 | 현재 트리거 |
|------------------|------|:------:|:-----------:|
| `BALANCE_WARN` | 수급 쏠림/부족 경고 | 🚨 | ✅ 구현됨 |
| `POLICY` | 정책 매칭 추천 | 📢 | ✅ 구현됨 |
| `ORDER` | 주문 상태 변경 | 📦 | ❌ 미구현 |
| `GUIDE` | 지자체 권고/영농 가이드 | 💡 | ❌ 미구현 |
| `SYSTEM` | 시스템 공지 (점검, 업데이트 등) | ⚙️ | ❌ 미구현 |

---

## 4. 수급 알림 발송 조건 (구현 완료)

| 수급 상태 | 비율 범위 | 발송 대상 | 메시지 |
|-----------|:---------:|-----------|--------|
| 🔴 과잉경고 | > 150% | 해당 작물 재배 농부 + 지자체(GOV) | "[작물명] 공급률이 X%로 과잉경고 상태입니다." |
| 🟠 과잉주의 | 120~150% | 해당 작물 재배 농부 + 지자체(GOV) | "[작물명] 공급률이 X%로 과잉주의 상태입니다." |
| 🟢 적정 | 80~120% | ❌ 미발송 | — |
| 🟡 부족주의 | 50~80% | 전체 농부 + 지자체(GOV) | "[작물명] 공급률이 X%로 부족주의입니다." |
| 🔵 부족경고 | < 50% | 전체 농부 + 지자체(GOV) | "[작물명] 공급률이 X%로 부족경고입니다." |

---

## 5. 페이지 알림(Toast/인앱) 활용 방안

> 페이지 알림이란 **사용자가 특정 액션을 수행했을 때 즉시 화면에 표시되는 피드백**(Toast, 모달, 배너 등)을 의미합니다.
> FCM 푸시와 달리 **해당 페이지에 머물러 있을 때만** 보이며, DB에 저장되지 않습니다.

### 5.1 활용 대상 및 적용 위치

| # | 도메인 | 페이지 경로 | 이벤트 | Toast 메시지 (예시) |
|:-:|--------|------------|--------|---------------------|
| 1 | 농장 | `/farm/register` | 농장 등록 신청 완료 | "✅ 농장 등록 신청이 완료되었습니다. 관리자 승인을 기다려 주세요." |
| 2 | 농장 | `/farm/seed` | 작물 등록 완료 | "🌱 작물 등록이 완료되었습니다! 맞춤 정책과 예측 리포트를 확인하세요." |
| 3 | 농장 | `/farm/harvest` | 수확 실적 등록 | "🌾 수확 실적이 등록되었습니다." |
| 4 | 상점 | `/shop` | 장바구니 담기 | "🛒 장바구니에 상품이 추가되었습니다." |
| 5 | 상점 | `/shop/checkout` | 주문/결제 완료 | "✅ 주문이 완료되었습니다. 주문 내역에서 확인하세요." |
| 6 | 상점 | `/shop/seller/orders` | 주문 상태 변경 (발송 처리) | "📦 발송 처리가 완료되었습니다." |
| 7 | 커뮤니티 | `/community` | 게시글 등록 | "📝 게시글이 등록되었습니다." |
| 8 | 커뮤니티 | `/community/[id]` | 댓글 등록 | "💬 댓글이 등록되었습니다." |
| 9 | AI 추천 | `/recommend` | 추천 결과 생성 완료 | "🤖 AI 작물 추천 분석이 완료되었습니다." |
| 10 | 정책 | `/policy` | 공문 PDF 생성 완료 | "📄 공문 초안이 생성되었습니다. 다운로드하세요." |
| 11 | 마이페이지 | `/mypage` | 프로필 수정 완료 | "✅ 프로필이 수정되었습니다." |
| 12 | 관리자 | `/admin/approvals` | 농장 승인/반려 처리 | "✅ 농장이 승인되었습니다." / "❌ 농장이 반려되었습니다." |
| 13 | 지자체 | `/gov/notices` | 권고 메시지 발송 완료 | "📢 권고 메시지가 발송되었습니다." |
| 14 | 지자체 | `/gov/reports` | 보고서 PDF 생성 완료 | "📊 보고서가 생성되었습니다." |

### 5.2 구현 방식

프로젝트에 이미 구현된 **Toast 컴포넌트 + ToastContext** (`components/common/Toast/`)를 사용합니다.

```tsx
// 사용 예시
import { useToast } from '@/components/common/Toast/ToastContext';

const { showToast } = useToast();
showToast('🌱 작물 등록이 완료되었습니다!', 'success');
```

---

## 6. FCM 푸시 알림 확장 방안

> FCM 푸시란 **사용자가 해당 페이지에 있지 않아도** 브라우저/디바이스에 알림이 도착하는 것입니다.
> 반드시 `notifications` 테이블에 DB 이력이 함께 저장됩니다.

### 6.1 현재 구현된 FCM 트리거 (2건)

| # | 트리거 | 타입 | 발송 위치 |
|:-:|--------|------|-----------|
| 1 | 수급 비율 임계값 초과/미달 | `BALANCE_WARN` | `BalanceEventListener` |
| 2 | 작물 등록 시 정책 매칭 안내 | `POLICY` | `CultivationEventListener` |

### 6.2 추가로 FCM이 필요한 시나리오 (6건)

| # | 시나리오 | 타입 | 발송 대상 | 트리거 위치 (코드) | 연관 기획 ID |
|:-:|----------|------|-----------|-------------------|:------------:|
| 1 | **농장 승인/반려** — 관리자가 농장 등록을 승인하면 농업인에게 즉시 알림 | `SYSTEM` | 신청한 농업인 | 관리자 승인 API (ADM-002) | USR-001 |
| 2 | **주문 상태 변경** — 셀러가 발송 처리하면 구매자에게 알림 | `ORDER` | 주문한 구매자 | 주문 상태 변경 API (USR-005) | USR-002 |
| 3 | **새 주문 접수** — 구매자가 주문하면 셀러에게 알림 | `ORDER` | 해당 상품 셀러 | 주문 생성 API (USR-002) | USR-005 |
| 4 | **지자체 권고/공지 발송** — 지자체 담당자가 메시지 작성 시 대상 농업인에게 FCM 발송 | `GUIDE` | 타겟 농업인 전체 | 지자체 권고 발송 API (GOV-005) | GOV-005 |
| 5 | **댓글/답변 알림** — 내 게시글에 댓글이 달리면 작성자에게 알림 | `SYSTEM` | 게시글 작성자 | 댓글 등록 API (USR-003) | USR-003 |
| 6 | **AI 추천 결과 완료** — 비동기 AI 추천이 완료되면 요청자에게 알림 | `SYSTEM` | 추천 요청자 | AI 추천 완료 콜백 (FRM-006) | FRM-006 |

### 6.3 우선순위 권장

```
P0 (즉시 구현 권장)
 ├─ #1 농장 승인/반려 알림 — 농업인이 가장 기다리는 알림
 └─ #4 지자체 권고 발송 — 기획서 GOV-005 명시 기능

P1 (상점 연동 시)
 ├─ #2 주문 상태 변경 (구매자 대상)
 └─ #3 새 주문 접수 (셀러 대상)

P2 (부가 기능)
 ├─ #5 댓글/답변 알림
 └─ #6 AI 추천 완료 알림
```

---

## 7. API 엔드포인트

| Method | URL | 설명 |
|--------|-----|------|
| `GET` | `/api/notifications` | 내 알림 목록 (페이징 + 필터) |
| `GET` | `/api/notifications/unread-count` | 안읽은 알림 수 |
| `PATCH` | `/api/notifications/{id}/read` | 개별 읽음 처리 |
| `PATCH` | `/api/notifications/read-all` | 전체 읽음 처리 |
| `POST` | `/api/fcm/tokens` | FCM 토큰 등록 |
| `DELETE` | `/api/fcm/tokens` | FCM 토큰 삭제 |

---

## 8. 파일 맵

### 백엔드 (`com.farmbalance.notification`)

| 계층 | 파일 | 역할 |
|------|------|------|
| Domain | `domain/Notification.java` | 알림 도메인 모델 |
| Domain | `domain/FcmToken.java` | FCM 토큰 도메인 모델 |
| Domain | `domain/NotificationType.java` | enum 정의 |
| Input Port | `application/port/in/NotificationUseCase.java` | 알림 CRUD + 벌크 생성 |
| Input Port | `application/port/in/FcmTokenUseCase.java` | 토큰 등록/삭제 |
| Output Port | `application/port/out/NotificationPort.java` | DB 인터페이스 |
| Output Port | `application/port/out/FcmTokenPort.java` | 토큰 DB 인터페이스 |
| Service | `application/service/NotificationService.java` | DB 저장 + FCM 발송 동시 처리 |
| Service | `application/service/FcmNotificationService.java` | Firebase SDK 실제 발송 |
| Service | `application/service/FcmTokenService.java` | 토큰 비즈니스 로직 |
| Controller | `adapter/in/web/NotificationController.java` | 알림 REST API |
| Controller | `adapter/in/web/FcmController.java` | FCM 토큰 REST API |
| Config | `global/config/FirebaseConfig.java` | Firebase Admin SDK 초기화 |
| Migration | `V34__create_fcm_tokens.sql` | fcm_tokens DDL |

### 이벤트 트리거

| 파일 | 트리거 조건 | 알림 타입 |
|------|------------|-----------|
| `balance/adapter/in/event/BalanceEventListener.java` | 수급 비율 임계값 초과/미달 | `BALANCE_WARN` |
| `farm/application/service/CultivationEventListener.java` | 작물 등록 시 | `POLICY` |

### 프론트엔드

| 파일 | 역할 |
|------|------|
| `lib/firebase.ts` | Firebase 초기화 + 토큰 발급 |
| `public/firebase-messaging-sw.js` | 백그라운드 푸시 수신 |
| `components/layout/Header/useFCM.ts` | FCM Hook (로그인 시 자동 등록) |
| `app/api/fcm/tokens/route.ts` | BFF 프록시 |
| `app/api/notifications/route.ts` | BFF 프록시 |
| `app/(main)/mypage/notifications/page.tsx` | 알림 목록 UI |
| `app/(main)/mypage/notifications/useNotifications.ts` | 알림 전용 Hook |
