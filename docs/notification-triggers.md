# 알림 발송 트리거 정리

> 양평군 농업 종합 플랫폼의 모든 알림 발송 조건을 정리한 문서입니다.
> 알림은 **DB 이력 저장 + FCM 푸시 발송**이 함께 이루어집니다.

최종 수정일: 2026-05-20

---

## 1. 알림 타입 개요

| 타입 | 한글명 | 발송 시점 | 채널 |
|------|--------|-----------|------|
| `BALANCE_WARN` | 수급 임계값 경고 | 작물 수급 비율이 임계 구간 진입 시 | DB + FCM |
| `GUIDE` | 영농 가이드 | 기상·재배일정·병해충·토양 조건 자동 판단 | DB + FCM |
| `POLICY` | 정책 매칭 | 작물 등록 시 매칭 정책 발생 | DB + FCM |
| `ORDER` | 주문 상태 변경 | 주문 접수·결제·배송 상태 변경 시 | DB + FCM |
| `SYSTEM` | 시스템 알림 | 농장 승인·반려, 댓글 등 시스템 이벤트 | DB + FCM |

---

## 2. BALANCE_WARN — 수급 임계값 경고

**구현 위치**: `BalanceEventListener.java`
**트리거**: 작물 등록·수정·삭제·수확 시 수급 비율 재계산 후 자동 발송
**쿨다운**: 동일 작물에 대해 5분 이내 중복 발송 방지

| 조건 | 메시지 | 발송 대상 |
|------|--------|-----------|
| 공급률 > 150% | **과잉경고** — 대안 작물 확인 권고 | 해당 작물 재배 농부 + 지자체 |
| 공급률 120 ~ 150% | **과잉주의** | 해당 작물 재배 농부 + 지자체 |
| 공급률 50 ~ 80% | **부족주의** — 재배 권장 | 전체 농부 + 지자체 |
| 공급률 < 50% | **부족경고** — 적극 재배 권장 | 전체 농부 + 지자체 |

**링크**: `/balance`

---

## 3. GUIDE — 영농 가이드 (자동 조건 알림)

### 3.1 기상 기반 알림

**구현 위치**: `WeatherGuideNotificationScheduler.java`
**트리거**: 매일 12:00 기상청 ASOS 데이터 수집 완료 후 이벤트 기반 자동 실행
**발송 대상**: 모든 등록 농부

| 조건 | 임계값 | 알림 제목 | 권고 내용 |
|------|--------|-----------|-----------|
| 서리 위험 | 최저기온 ≤ 2°C | 서리 위험 주의 | 보온 덮개 설치 및 작물 보온 |
| 폭염 주의 | 최고기온 ≥ 33°C | 폭염 주의 | 충분한 관수 및 차광 조치 |
| 집중호우 | 일 강수량 ≥ 50mm | 집중호우 주의 | 배수로 점검, 침수 대비 |
| 가뭄 주의 | 최근 7일 누적 강수량 < 10mm | 가뭄 주의 — 관수 권고 | 토양 수분 확인 및 정기 관수 |
| 고습 주의 | 평균 습도 ≥ 90% | 고습 주의 — 병해충 예방 | 환기 강화, 곰팡이병·노균병 방제 |

**링크**: `/mypage/notifications`

---

### 3.2 재배 일정 기반 알림

**구현 위치**: `CultivationScheduleGuideScheduler.java`
**트리거**: 매일 09:00 실행
**발송 대상**: ACTIVE 상태 재배 등록을 가진 농부 (파종일 기준)
**중복 방지**: 같은 달에 동일 제목 알림 이미 발송 시 스킵

| 조건 | 알림 제목 | 권고 내용 |
|------|-----------|-----------|
| 농사로 일정상 이달이 수확 시기 (operation_name에 '수확' 포함) | `[작물명] 수확 적기 안내` | 적기 수확으로 품질·수익 향상 |
| 농사로 일정상 이달의 주요 농작업 (info_type_code=410001) | `[작물명] 이달의 주요 농작업` | 이달의 작업 목록 안내 (최대 3개) |

**데이터 소스**: `nongsaro_farm_schedules` 테이블 (농사로 API)
**링크**: `/farm/harvest` 또는 `/farm`

---

### 3.3 병해충 시기 기반 알림

**구현 위치**: `PestAlertScheduler.java`
**트리거**: 매일 09:30 실행
**발송 대상**: ACTIVE 상태 재배 등록을 가진 농부
**중복 방지**: 같은 달에 동일 제목 알림 이미 발송 시 스킵

| 조건 | 알림 제목 | 권고 내용 |
|------|-----------|-----------|
| 이달이 작물별 병해충 발생 시기 | `[작물명] 병해충 주의보` | 위험 항목 안내 + 예방 방제 권고 |

**필터링 로직**:
- 포함 키워드: `병`, `충`, `해충`, `역병`, `탄저`, `노균`, `도열`, `흰가루`
- 제외 키워드: `가뭄`, `장마`, `잦은비`, `폭염`, `냉해`, `태풍`, `서리` *(기상은 3.1에서 처리)*

**데이터 소스**: `nongsaro_farm_schedules` 테이블 (`info_type_code = '410002'`)
**링크**: `/farm`

---

### 3.4 토양 기반 알림

**구현 위치**: `SoilGuideScheduler.java`
**트리거**: 매일 10:00 실행
**발송 대상**: 농장 토양 정보(pH 또는 유기물)가 등록된 ACTIVE 재배 농부
**중복 방지**: 같은 달에 동일 제목 알림 이미 발송 시 스킵

| 조건 | 알림 제목 | 권고 내용 |
|------|-----------|-----------|
| 농장 pH < 작물 최적 pH 최소값 | `[농장명] 토양 pH 부적합 (산성)` | 석회(고토석회) 시용으로 중화 |
| 농장 pH > 작물 최적 pH 최대값 | `[농장명] 토양 pH 부적합 (알칼리)` | 황(유황) 시용 또는 산성 비료 |
| 농장 유기물 < 작물 최적치 × 70% | `[농장명] 토양 유기물 부족` | 완숙 퇴비, 녹비작물 시용 |

**데이터 소스**: `farms` 테이블 (`soil_ph`, `soil_organic_matter`) ⨝ `crop_cultivation_env` 테이블
**링크**: `/farm`

---

## 4. POLICY — 정책 매칭 알림

**구현 위치**: `CultivationEventListener.java`
**트리거**: 사용자가 재배 등록(작물 신규 등록) 시 자동 발송
**발송 대상**: 등록한 본인

| 조건 | 메시지 |
|------|--------|
| 신규 재배 등록 완료 | `등록하신 [작물명] 재배에 대한 양평군의 최신 지원 정책을 확인해 보세요!` |

**링크**: `/policy`

---

## 5. ORDER — 주문 상태 변경 알림

**구현 위치**: `OrderService.java`
**트리거**: 주문 생성·결제·배송 상태 변경 시 발송

| 조건 | 발송 대상 | 메시지 | 링크 |
|------|-----------|--------|------|
| 새 결제/주문 확정 | 셀러 | 새 결제/주문이 확정되었습니다. | `/shop/seller/orders` |
| 주문 접수 | 구매자 | 주문하신 상품이 접수되었습니다. | `/mypage/history` |
| 배송 시작 | 구매자 | 주문하신 상품이 배송 시작되었습니다. | `/mypage/history` |

---

## 6. SYSTEM — 시스템 알림

### 6.1 농장 승인/반려

**구현 위치**: `FarmApprovalService.java`
**트리거**: 관리자가 농장 등록 신청에 대해 승인/반려 액션 수행 시

| 조건 | 메시지 | 링크 |
|------|--------|------|
| 농장 승인 | `축하합니다! [농장명] 농장이 승인되었습니다. 이제 작물을 등록할 수 있습니다.` | `/farm` |
| 농장 반려 | `[농장명] 농장 등록이 반려되었습니다. 사유: {reason}` | `/farm/register` |

### 6.2 커뮤니티 댓글

**구현 위치**: `CommentService.java`
**트리거**: 게시글에 댓글이 달릴 때 게시자에게 알림

---

## 7. 알림 스케줄 타임라인

```
09:00  → CultivationScheduleGuideScheduler  (재배 일정)
09:30  → PestAlertScheduler                  (병해충 시기)
10:00  → SoilGuideScheduler                  (토양 적합도)
12:00  → DailyWeatherRecordScheduler         (기상 데이터 수집)
         └─ WeatherAlertEvent 발행
            └─ WeatherGuideNotificationScheduler 비동기 실행 (기상 기반)

이벤트 기반 (실시간)
  • 작물 등록/수정/삭제   → BalanceEventListener  (수급)
  • 작물 등록            → CultivationEventListener  (정책)
  • 농장 승인/반려        → FarmApprovalService  (시스템)
  • 주문 상태 변경        → OrderService  (주문)
  • 댓글 작성            → CommentService  (시스템)
```

---

## 8. 중복 발송 방지 정책

| 알림 타입 | 중복 방지 방식 | 기간 |
|-----------|----------------|------|
| `BALANCE_WARN` | 메모리 캐시 (`Map<cropName, Instant>`) | 5분 |
| `GUIDE` (기상) | 미적용 — 매일 새로운 기상 조건 평가 | — |
| `GUIDE` (일정·병해충·토양) | DB 쿼리 (`notifications.title` + 이번 달 범위) | 1개월 |
| `POLICY`·`ORDER`·`SYSTEM` | 이벤트당 1회 발송 | — |

---

## 9. FCM 푸시 발송 흐름

```
NotificationUseCase.createNotification()
    ├─ NotificationPort.save()  ← DB 이력 저장
    └─ FcmNotificationService.sendToUser()  ← 비동기 푸시
            ├─ 사용자의 모든 FCM 토큰 조회 (fcm_tokens 테이블)
            ├─ Firebase Admin SDK로 발송
            └─ 만료된 토큰 자동 삭제 (UNREGISTERED 에러 시)
```

**프론트엔드 동작**:
- 탭 활성 시: 벨 아이콘 뱃지만 갱신
- 탭 비활성 시: 브라우저 푸시 알림 표시
- 클릭 시 알림의 `link` 필드로 이동

---

## 10. 관련 파일 맵

### 백엔드
| 카테고리 | 파일 경로 |
|----------|-----------|
| **알림 도메인** | `notification/domain/Notification.java`, `NotificationType.java` |
| **알림 서비스** | `notification/application/service/NotificationService.java` |
| **FCM 발송** | `notification/application/service/FcmNotificationService.java` |
| **수급 알림** | `balance/adapter/in/event/BalanceEventListener.java` |
| **기상 알림** | `farm/application/service/WeatherGuideNotificationScheduler.java` |
| **재배일정 알림** | `farm/application/service/CultivationScheduleGuideScheduler.java` |
| **병해충 알림** | `farm/application/service/PestAlertScheduler.java` |
| **토양 알림** | `farm/application/service/SoilGuideScheduler.java` |
| **정책 알림** | `farm/application/service/CultivationEventListener.java` |
| **농장 승인 알림** | `admin/application/service/FarmApprovalService.java` |
| **주문 알림** | `shop/application/service/OrderService.java` |

### 프론트엔드
| 카테고리 | 파일 경로 |
|----------|-----------|
| **알림 목록 페이지** | `app/(main)/mypage/notifications/page.tsx` |
| **알림 API 호출** | `app/(main)/mypage/notifications/_lib/notification.api.ts` |
| **FCM 토큰 등록** | `components/layout/Header/useFCM.ts` |
| **Firebase 초기화** | `lib/firebase.ts` |
| **Service Worker** | `public/firebase-messaging-sw.js` |
