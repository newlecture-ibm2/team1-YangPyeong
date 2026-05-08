# 🛒 상품 검수(관리자 승인) 프로세스 — 작업 체크리스트

> **작성일**: 2026-05-08  
> **관련 문서**: [shop-product-approval-process.md](./shop-product-approval-process.md)  
> **브랜치**: `stage-shop-ai`

---

## 1. ✅ 완료된 작업 (판매자/장터 측)

### 백엔드

|   #   | 작업 내용                                              | 파일                         |   상태   |
| :---: | ------------------------------------------------------ | ---------------------------- | :------: |
|   1   | 상품 등록 시 `ACTIVE` → `PENDING` 상태로 저장          | `ProductService.java` (60행) |    ✅     |
|   2   | 상품 수정 시 다시 `PENDING` 상태로 전환 (재검수)       | `ProductService.java` (88행) |    ✅     |
|   3   | `ProductStatus` enum에 `PENDING`, `REJECTED` 존재 확인 | `ProductStatus.java`         | ✅ (기존) |
|   4   | 장터 조회 쿼리에서 `ACTIVE`, `SOLDOUT`만 조회          | `ProductJpaRepository.java`  | ✅ (기존) |
|   5   | 삭제 시 `deleted_at` Soft Delete                       | `ProductJpaEntity.java`      | ✅ (기존) |

### 프론트엔드

|   #   | 작업 내용                                                        | 파일                     |   상태   |
| :---: | ---------------------------------------------------------------- | ------------------------ | :------: |
|   1   | `ProductStatus` 타입에 `PENDING`, `REJECTED` 추가                | `mypage.types.ts`        |    ✅     |
|   2   | `PRODUCT_STATUS_MAP`에 검수중(🟡), 반려됨(🔴) 뱃지 매핑            | `mypage.types.ts`        |    ✅     |
|   3   | 판매 목록 필터 탭에 "검수중", "반려" 탭 추가                     | `seller/page.tsx`        |    ✅     |
|   4   | `PENDING`/`REJECTED` → 뱃지 표시, 승인 후 → 드롭다운 표시        | `seller/page.tsx`        |    ✅     |
|   5   | `PENDING` 상태에서 [수정] 버튼 disabled                          | `seller/page.tsx`        |    ✅     |
|   6   | `REJECTED` 상태에서 [수정] 버튼 활성화 (재수정 허용)             | `seller/page.tsx`        |    ✅     |
|   7   | `PENDING`/`REJECTED` 상품은 재고 0이어도 강제 SOLDOUT 변환 방지  | `useSellerProducts.ts`   |    ✅     |
|   8   | stats에 `pending`, `rejected` 카운트 추가                        | `useSellerProducts.ts`   |    ✅     |
|   9   | 필터 탭 CSS (`.statPending`, `.statRejected`) 추가               | `seller/page.module.css` |    ✅     |
|  10   | 상품 등록 성공 시 "관리자 검수 후 장터에 노출됩니다" 토스트 알림 | `register/page.tsx`      |    ✅     |
|  11   | 상품명 최소 글자 수 2 → 1로 변경 ("벼" 등 허용)                  | `register/page.tsx`      |    ✅     |
|  12   | 각 입력 필드 아래 인라인 유효성 경고 메시지 추가 (touched 기반)  | `register/page.tsx`      |    ✅     |
|  13   | `shop.types.ts`에 `PENDING`, `REJECTED` 타입 존재 확인           | `shop.types.ts`          | ✅ (기존) |

---

## 2. ⏳ 관리자 팀원이 해야 할 작업

> 관리자 도메인(`/admin/shop`) 담당 팀원이 아래 작업을 완료해야 승인 프로세스가 End-to-End로 동작합니다.

|   #   | 작업 내용                                               | 우선순위 | 비고                                                        |
| :---: | ------------------------------------------------------- | :------: | ----------------------------------------------------------- |
|   1   | 관리자 검수 대기 목록 화면 (`/admin/shop`)              |  🔴 필수  | `status = 'PENDING'` AND `deleted_at IS NULL` 조건으로 조회 |
|   2   | 승인 API: 상품 상태를 `PENDING` → `ACTIVE`로 변경       |  🔴 필수  | `PATCH /api/admin/shop/{productId}/approve`                 |
|   3   | 반려 API: 상품 상태를 `PENDING` → `REJECTED`로 변경     |  🔴 필수  | `PATCH /api/admin/shop/{productId}/reject` + 반려 사유 저장 |
|   4   | 반려 사유 컬럼 추가 (DB 마이그레이션)                   |  🟡 권장  | `products` 테이블에 `rejection_reason TEXT` 컬럼 추가       |
|   5   | 관리자 검수 상세 화면 (상품 내용 확인 + 승인/반려 버튼) |  🔴 필수  | —                                                           |

---

## 3. ⏳ 관리자 완료 후 이어서 할 작업 

|   #   | 작업 내용                                                   | 담당   | 비고                                                         |
| :---: | ----------------------------------------------------------- | ------ | ------------------------------------------------------------ |
|   1   | 판매자 목록에서 반려 사유 표시 UI                           | 프론트 | `REJECTED` 행에 반려 사유 툴팁 또는 모달 표시                |
|   2   | 알림 시스템 연동 — 승인/반려 시 판매자에게 알림 발송        | 공동   | `COM-004 알림 시스템` 모듈 개발 시 함께 진행                 |
|   3   | 장바구니에 담긴 상품의 상태 변경 방어 로직                  | 백엔드 | 상품이 `PENDING`/`REJECTED`/삭제 시 장바구니·결제 차단       |
|   4   | 상품 수정 페이지에서 수정 완료 시 "재검수 대상" 안내 토스트 | 프론트 | "수정이 완료되었습니다. 관리자 재검수 후 장터에 노출됩니다." |

---

## 4. 참고: 상태별 동작 요약표

```
[등록] → PENDING(검수중) → [관리자 승인] → ACTIVE(판매중)
                         → [관리자 반려] → REJECTED(반려됨) → [유저 재수정] → PENDING
                                                            → [유저 삭제]  → deleted_at 처리

[승인된 상품 수정] → PENDING(검수중) → [관리자 재승인] → ACTIVE(판매중)

[승인된 상품 상태 변경 (드롭다운)] → 재검수 없이 즉시 반영
    ├─ ACTIVE ↔ SOLDOUT ↔ INACTIVE
    └─ 장터 노출: ACTIVE(노출+구매가능), SOLDOUT(노출+구매불가), INACTIVE(미노출)
```

---

## 5. 주의사항

- **백엔드 변경 사항이 있으므로 서버 재시작(`bootRun`) 필수**
- 상태 변경 API(`PATCH /api/shop/seller/{id}/status`)는 재검수 대상이 **아님** (드롭다운 전용)
- 상품 내용 수정 API(`PUT`)만 재검수 대상 (`PENDING` 전환)
- 명세서: `docs/development/shop-product-approval-process.md` 참조
