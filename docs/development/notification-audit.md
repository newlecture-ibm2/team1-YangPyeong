# 🔍 알림 시스템 점검 보고서

> 점검일: 2026-05-12  
> 점검 범위: Firebase FCM, 프론트엔드 알림 UI, 백엔드 알림 발송 로직

---

## ✅ 수정 완료된 항목

| # | 문제 | 수정 커밋 |
|:-:|------|-----------|
| 1 | `unread-count` API 무한 호출 (31,000건+) — `useCallback` 의존성 불안정 | `946e295` |
| 2 | `onMessageListener` Promise 방식 → 첫 번째 알림만 수신되는 버그 | `1f7b6c1` |
| 3 | 수급 알림 URL `/farm/balance` → `/balance` 수정 | `6c63d87` |
| 4 | 드롭다운 읽음 처리 시 배경색 미변경 (로컬 상태 미갱신) | `6c63d87` |
| 5 | 드롭다운에 알림 내용(message) 미표시 | `6c63d87` |
| 6 | 포그라운드/비활성 탭 조건부 알림 (`document.hidden` 분기) | `81544fe` |
| 7 | 수급 알림 중복 발송 — 5분 쿨다운 추가 (`ConcurrentHashMap`) | `73dc2c2` |
| 8 | FCM 토큰 매 새로고침마다 중복 등록 — `localStorage` 비교 후 생략 | `73dc2c2` |
| 9 | Bulk 알림 N+1 최적화 — `saveAll()` 배치 INSERT 적용 | 해당 커밋 |
| 10 | 상품 검수 알림 링크 `/seller/products` → `/mypage/seller` 수정 — DB에 저장된 기존 알림은 수동 UPDATE 필요 | - |

---

## 📝 수정 상세

### 1. unread-count API 무한 호출 (🔴 긴급)

**원인:** `Header.tsx`의 `fetchUnreadCount`가 `useCallback(..., [user])`로 선언되어 `user` 객체가 매 렌더링마다 새로운 참조를 생성 → `useEffect` 재실행 → `setInterval` + `addEventListener` 중복 등록 → 무한 루프.

**수정:** `user` 객체를 `useRef`로 관리하여 `useCallback` 의존성을 빈 배열 `[]`로 안정화. `setInterval`이 1개만 등록되도록 보장.

```diff
+ const userRef = useRef(user);
+ useEffect(() => { userRef.current = user; }, [user]);

  const fetchUnreadCount = useCallback(async () => {
-   if (!user) {
+   if (!userRef.current) {
      ...
-  }, [user]);
+  }, []);
```

---

### 2. onMessageListener 버그 (🔴 긴급)

**원인:** `Promise` 방식은 `resolve()`가 단 1번만 호출되므로 첫 번째 알림만 수신. `useFCM.ts`에서 `while(active)` 루프로 무한 반복 호출하면서 리스너 누적 → 메모리 누수.

**수정:** `Promise` → `Callback` 방식으로 변경. Firebase `onMessage()`가 반환하는 `unsubscribe` 함수를 cleanup에서 호출.

---

### 3~5. 수급 알림 URL + 드롭다운 개선

- `BalanceEventListener.java`의 알림 링크를 `/farm/balance` → `/balance`로 수정
- 알림 클릭 시 `setRecentNotifs` 상태를 갱신하여 읽음 배경색 즉시 반영
- 드롭다운에 `notifItemMessage` 요소를 추가하여 알림 본문(message) 최대 2줄 표시

---

### 6. 포그라운드/비활성 탭 조건부 알림

**수정:** `document.hidden` 체크를 추가하여 FarmBalance 탭이 활성(보고 있을 때)이면 팝업 생략, 비활성(다른 탭을 보고 있을 때)이면 `new Notification()`으로 브라우저 팝업 표시.

---

### 7. 수급 알림 5분 쿨다운 (🔴 높음)

**원인:** 농업인이 재배 면적을 여러 번 수정하면 `CultivationChangedEvent`가 매번 발생하여 같은 내용의 수급 알림이 모든 대상에게 중복 전송.

**수정:** `BalanceEventListener`에 `ConcurrentHashMap<작물명, Instant>`을 추가. 같은 작물에 대해 마지막 알림 발송 후 **5분(300초)** 이내 재발송 요청이 오면 자동 무시.

---

### 8. FCM 토큰 중복 등록 방지 (🟢 낮음)

**수정:** `useFCM.ts`에서 `requestForToken()` 결과와 `localStorage`의 기존 토큰을 비교. 동일하면 백엔드 POST를 건너뛰어 불필요한 네트워크 요청 제거.

---

### 9. Bulk 알림 N+1 최적화 (🟡 중간)

**원인:** `createBulkNotifications()`가 for문 안에서 `save()` 1건씩 호출 (N+1 패턴).

**수정:** `NotificationPort`에 `saveAll()` 메서드를 추가하고, 벌크 알림 생성 시 한 번에 배치 INSERT. FCM 발송은 기존과 동일하게 유저별 비동기 발송 유지 (Firebase Admin SDK 제약).

---

## ✅ 점검 결과 — 안전한 부분

| 항목 | 상태 | 비고 |
|------|:----:|------|
| Firebase 초기화 (SSR 가드) | ✅ | `typeof window !== 'undefined'` 체크 정상 |
| 서비스 워커 등록 | ✅ | `/firebase-messaging-sw.js` 정상 |
| 서비스 워커 push/click 핸들러 | ✅ | 백그라운드 알림 + 클릭 시 이동 정상 |
| FCM 토큰 만료 처리 | ✅ | `UNREGISTERED` 에러 시 자동 삭제 |
| 로그아웃 시 토큰 삭제 | ✅ | `Header.tsx`에서 DELETE + localStorage 제거 |
| 알림 읽음 처리 API | ✅ | PATCH `/api/notifications/{id}/read` 정상 |
| BFF 인증 가드 | ✅ | `unread-count` 등 JWT 없으면 401 반환 |
| 30초 폴링 + cleanup | ✅ | `clearInterval` + `removeEventListener` 정상 |
