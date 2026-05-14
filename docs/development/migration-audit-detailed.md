# JPA 엔티티 - 마이그레이션 상세 검증 보고서

**작성일**: 2026-05-14  
**검증 범위**: 모든 @Entity 클래스 (35개)  
**마이그레이션**: V1__init_all_tables.sql + V5~V12

---

## 검증 개요

각 JPA 엔티티의 모든 필드를 마이그레이션 DDL과 1:1 비교하여 다음을 확인:
- 테이블 존재 여부 및 컬럼 개수
- JPA 타입과 DB 타입 호환성 (CRITICAL 체크)
- nullable 제약 조건 일치
- 길이(length) 제약 일치
- 인덱스/UNIQUE 제약 일치
- Soft Delete (deleted_at) 구현 일치
- BaseTimeEntity 상속 시 created_at/updated_at/deleted_at 확인

---

## 1. UserJpaEntity → users

**파일**: `backend/src/main/java/com/farmbalance/user/adapter/out/persistence/entity/UserJpaEntity.java`  
**테이블**: ✅ 존재  
**상속**: 없음 (직접 @CreatedDate/@LastModifiedDate 어노테이션)

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| email | @Column NOT NULL UNIQUE VARCHAR(255) | email | VARCHAR(255) NOT NULL UNIQUE | ✅ |
| password | @Column VARCHAR(255) | password | VARCHAR(255) | ✅ |
| name | @Column NOT NULL VARCHAR(50) | name | VARCHAR(50) NOT NULL | ✅ |
| phone | @Column VARCHAR(20) | phone | VARCHAR(20) | ✅ |
| role | @Enumerated STRING VARCHAR(20) NOT NULL | role | VARCHAR(20) NOT NULL DEFAULT 'USER' | ✅ |
| status | @Enumerated STRING VARCHAR(20) NOT NULL | status | VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' | ✅ |
| provider | @Enumerated STRING VARCHAR(20) NOT NULL | provider | VARCHAR(20) NOT NULL DEFAULT 'LOCAL' | ✅ |
| providerId | @Column VARCHAR(100) | provider_id | VARCHAR(100) | ✅ |
| profileImageUrl | @Column VARCHAR(200) | profile_image_url | VARCHAR(200) | ✅ |
| address | @Column VARCHAR(255) | address | VARCHAR(255) | ✅ |
| bio | @Column TEXT | bio | TEXT | ✅ |
| withdrawalRequestedAt | @Column TIMESTAMP | withdrawal_requested_at | TIMESTAMP | ✅ |
| anonymizedAt | @Column TIMESTAMP | anonymized_at | TIMESTAMP | ✅ |
| regionCode | @Column VARCHAR(20) | region_code | VARCHAR(20) | ✅ |
| createdAt | @CreatedDate TIMESTAMP NOT NULL | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |
| updatedAt | @LastModifiedDate TIMESTAMP | updated_at | TIMESTAMP | ✅ |

### 발견된 문제
- ✅ 문제 없음

---

## 2. UserSocialAccountJpaEntity → user_social_accounts

**파일**: `backend/src/main/java/com/farmbalance/user/adapter/out/persistence/entity/UserSocialAccountJpaEntity.java`  
**테이블**: ✅ 존재  
**상속**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| userId | @Column NOT NULL (user_id) | user_id | BIGINT NOT NULL REFERENCES users | ✅ |
| provider | @Enumerated STRING VARCHAR(20) NOT NULL | provider | VARCHAR(20) NOT NULL | ✅ |
| providerId | @Column NOT NULL VARCHAR(100) (provider_id) | provider_id | VARCHAR(100) NOT NULL | ✅ |
| linkedAt | @CreatedDate TIMESTAMP | linked_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |

### UNIQUE 제약 검증
- JPA: `@UniqueConstraint(columnNames = {"provider", "provider_id"})`
- DB: `UNIQUE (provider, provider_id)`
- ✅ 일치

---

## 3. SecurityQuestionJpaEntity → security_questions

**파일**: `backend/src/main/java/com/farmbalance/user/adapter/out/persistence/entity/SecurityQuestionJpaEntity.java`  
**테이블**: ✅ 존재  
**상속**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| userId | @Column NOT NULL UNIQUE | user_id | BIGINT NOT NULL UNIQUE REFERENCES users | ✅ |
| question | @Column NOT NULL VARCHAR(200) | question | VARCHAR(200) NOT NULL | ✅ |
| answer | @Column NOT NULL VARCHAR(255) | answer | VARCHAR(255) NOT NULL | ✅ |
| createdAt | @CreatedDate TIMESTAMP | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |
| updatedAt | @LastModifiedDate TIMESTAMP | updated_at | TIMESTAMP | ✅ |

---

## 4. UserSanctionLogJpaEntity → user_sanction_logs

**파일**: `backend/src/main/java/com/farmbalance/admin/adapter/out/persistence/entity/UserSanctionLogJpaEntity.java`  
**테이블**: ✅ 존재  
**상속**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| targetUserId | @Column NOT NULL (target_user_id) | target_user_id | BIGINT NOT NULL REFERENCES users ON DELETE CASCADE | ✅ |
| actionType | @Column NOT NULL VARCHAR(50) (action_type) | action_type | VARCHAR(50) NOT NULL | ✅ |
| reasonType | @Column NOT NULL VARCHAR(50) (reason_type) | reason_type | VARCHAR(50) NOT NULL | ✅ |
| reasonDetail | @Column TEXT (reason_detail) | reason_detail | TEXT | ✅ |
| createdAt | @CreatedDate TIMESTAMP | created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | ✅ |

---

## 5. FarmJpaEntity → farms

**파일**: `backend/src/main/java/com/farmbalance/farm/adapter/out/persistence/entity/FarmJpaEntity.java`  
**테이블**: ✅ 존재  
**상속**: BaseTimeEntity (created_at, updated_at 포함)

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| user | @ManyToOne @JoinColumn NOT NULL | user_id | BIGINT NOT NULL REFERENCES users | ✅ |
| name | @Column NOT NULL VARCHAR(100) | name | VARCHAR(100) NOT NULL | ✅ |
| address | @Column NOT NULL VARCHAR(255) | address | VARCHAR(255) NOT NULL | ✅ |
| bjdCode | @Column VARCHAR(10) (bjd_code) | bjd_code | VARCHAR(10) | ✅ |
| pnuCode | @Column VARCHAR(19) (pnu_code) | pnu_code | VARCHAR(19) | ✅ |
| latitude | @Column DOUBLE (latitude) | latitude | DOUBLE PRECISION | ✅ |
| longitude | @Column DOUBLE (longitude) | longitude | DOUBLE PRECISION | ✅ |
| area | @Column DOUBLE (area) | area | DOUBLE PRECISION | ✅ |
| soilType | @Column VARCHAR(50) (soil_type) | soil_type | VARCHAR(50) | ✅ |
| ph | @Column DOUBLE (soil_ph) | soil_ph | DOUBLE PRECISION | ✅ |
| organicMatter | @Column DOUBLE (soil_organic_matter) | soil_organic_matter | DOUBLE PRECISION | ✅ |
| documents | @JdbcTypeCode JSON JSONB | documents | JSONB | ✅ |
| documentData | @JdbcTypeCode JSON JSONB | document_data | JSONB | ✅ |
| certificationStatus | @Enumerated STRING VARCHAR(20) NOT NULL | certification_status | VARCHAR(20) NOT NULL DEFAULT 'PENDING' | ✅ |
| rejectReason | @Column VARCHAR(500) (reject_reason) | reject_reason | VARCHAR(500) | ✅ |
| status | @Enumerated STRING VARCHAR(20) NOT NULL | status | VARCHAR(20) NOT NULL DEFAULT 'OPERATING' | ✅ |
| deletedAt | @Column TIMESTAMP (deleted_at) | deleted_at | TIMESTAMP | ✅ |
| createdAt | BaseTimeEntity | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |
| updatedAt | BaseTimeEntity | updated_at | TIMESTAMP | ✅ |

### 발견된 문제
- ✅ 문제 없음

---

## 6. CultivationRegistrationJpaEntity → cultivation_registrations

**파일**: `backend/src/main/java/com/farmbalance/farm/adapter/out/persistence/entity/CultivationRegistrationJpaEntity.java`  
**테이블**: ✅ 존재  
**상속**: BaseTimeEntity

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| farmId | @Column NOT NULL (farm_id) | farm_id | BIGINT NOT NULL REFERENCES farms | ✅ |
| cropId | @Column NOT NULL (crop_id) | crop_id | BIGINT NOT NULL REFERENCES crops | ✅ |
| cultivationArea | @Column NUMERIC (cultivation_area) | cultivation_area | DECIMAL(10,2) | ✅ (NUMERIC = DECIMAL) |
| farmerEstimatedYield | @Column NUMERIC (farmer_estimated_yield) | farmer_estimated_yield | DECIMAL(12,2) | ✅ |
| yieldUnit | @Column VARCHAR(10) (yield_unit) | yield_unit | VARCHAR(10) | ✅ |
| status | @Enumerated STRING VARCHAR(20) NOT NULL | status | VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' | ✅ |
| deletedAt | @Column TIMESTAMP (deleted_at) | deleted_at | TIMESTAMP | ✅ |
| createdAt | BaseTimeEntity | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |
| updatedAt | BaseTimeEntity | updated_at | TIMESTAMP | ✅ |

---

## 7. HarvestRecordJpaEntity → harvest_records

**파일**: `backend/src/main/java/com/farmbalance/farm/adapter/out/persistence/entity/HarvestRecordJpaEntity.java`  
**테이블**: ✅ 존재  
**상속**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| cultivationRegistrationId | @Column NOT NULL (cultivation_registration_id) | cultivation_registration_id | BIGINT NOT NULL REFERENCES cultivation_registrations ON DELETE CASCADE | ✅ |
| harvestDate | @Column NOT NULL (harvest_date) | harvest_date | DATE NOT NULL | ✅ |
| yieldAmount | @Column precision=12 scale=2 NOT NULL (yield_amount) | yield_amount | DECIMAL(12,2) NOT NULL | ✅ |
| yieldUnit | @Column NOT NULL VARCHAR(10) (yield_unit) | yield_unit | VARCHAR(10) NOT NULL | ✅ |
| grade | @Column VARCHAR(10) | grade | VARCHAR(10) | ✅ |
| toShop | @Column Boolean (to_shop) | to_shop | BOOLEAN DEFAULT false | ✅ |
| createdAt | @CreatedDate TIMESTAMP NOT NULL | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |

---

## 8. HistoryJpaEntity → cultivation_history

**파일**: `backend/src/main/java/com/farmbalance/history/adapter/out/persistence/entity/HistoryJpaEntity.java`  
**테이블**: ✅ 존재  
**상속**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| farmId | @Column NOT NULL | farm_id | BIGINT NOT NULL REFERENCES farms ON DELETE CASCADE | ✅ |
| cultivationRegistrationId | @Column | cultivation_registration_id | BIGINT REFERENCES cultivation_registrations ON DELETE CASCADE | ✅ |
| recordDate | @Column NOT NULL LocalDate | record_date | DATE NOT NULL DEFAULT CURRENT_DATE | ✅ |
| activityType | @Enumerated STRING VARCHAR(20) (activity_type) | activity_type | VARCHAR(20) | ✅ |
| activityContent | @Column TEXT (activity_content) | activity_content | TEXT | ✅ |
| avgTemp | @Column precision=5 scale=1 BigDecimal (avg_temp) | avg_temp | DECIMAL(5,1) | ✅ |
| totalRain | @Column precision=7 scale=1 BigDecimal (total_rain) | total_rain | DECIMAL(7,1) | ✅ |
| createdAt | @CreatedDate TIMESTAMP | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |

---

## 9. PostCategoryEntity → post_categories

**파일**: `backend/src/main/java/com/farmbalance/community/adapter/out/persistence/entity/PostCategoryEntity.java`  
**테이블**: ✅ 존재  
**상속**: BaseTimeEntity

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| name | @Column NOT NULL UNIQUE VARCHAR(50) | name | VARCHAR(50) NOT NULL UNIQUE | ✅ |
| description | @Column VARCHAR(200) | description | VARCHAR(200) | ✅ |
| displayOrder | @Column int (display_order) | display_order | INT DEFAULT 0 | ✅ |
| isActive | @Column boolean (is_active) | is_active | BOOLEAN DEFAULT true | ✅ |
| deletedAt | @Column TIMESTAMP (deleted_at) | deleted_at | TIMESTAMP | ✅ |
| createdAt | BaseTimeEntity | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |
| updatedAt | BaseTimeEntity | updated_at | TIMESTAMP | ✅ |

---

## 10. PostEntity → posts

**파일**: `backend/src/main/java/com/farmbalance/community/adapter/out/persistence/entity/PostEntity.java`  
**테이블**: ✅ 존재  
**상속**: BaseTimeEntity

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| authorId | @Column NOT NULL (author_id) | author_id | BIGINT NOT NULL REFERENCES users | ✅ |
| category | @ManyToOne @JoinColumn NOT NULL (category_id) | category_id | BIGINT NOT NULL REFERENCES post_categories | ✅ |
| title | @Column NOT NULL VARCHAR(100) | title | VARCHAR(200) NOT NULL | ⚠️ **LENGTH MISMATCH** |
| content | @Column NOT NULL TEXT | content | TEXT NOT NULL | ✅ |
| viewCount | @Column int (view_count) | view_count | INT DEFAULT 0 | ✅ |
| isNotice | @Column boolean (is_notice) | is_notice | BOOLEAN DEFAULT false | ✅ |
| deletedAt | @Column TIMESTAMP (deleted_at) | deleted_at | TIMESTAMP | ✅ |
| createdAt | BaseTimeEntity | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |
| updatedAt | BaseTimeEntity | updated_at | TIMESTAMP | ✅ |

### 발견된 문제
- ⚠️ **LENGTH MISMATCH**: `title` 필드
  - JPA: `@Column(nullable = false, length = 100)`
  - DB: `VARCHAR(200) NOT NULL`
  - 위험도: **MEDIUM** - DB가 더 크므로 유효성 검사 불일치 가능성

---

## 11. CommentEntity → comments

**파일**: `backend/src/main/java/com/farmbalance/community/adapter/out/persistence/entity/CommentEntity.java`  
**테이블**: ✅ 존재  
**상속**: BaseTimeEntity

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| post | @ManyToOne @JoinColumn NOT NULL (post_id) | post_id | BIGINT NOT NULL REFERENCES posts | ✅ |
| authorId | @Column NOT NULL (author_id) | author_id | BIGINT NOT NULL REFERENCES users | ✅ |
| content | @Column NOT NULL TEXT | content | TEXT NOT NULL | ✅ |
| accepted | @Column NOT NULL boolean | accepted | BOOLEAN DEFAULT false | ✅ |
| parentId | @Column (parent_id) | parent_id | BIGINT | ✅ |
| deletedAt | @Column TIMESTAMP (deleted_at) | deleted_at | TIMESTAMP | ✅ |
| createdAt | BaseTimeEntity | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |
| updatedAt | BaseTimeEntity | updated_at | TIMESTAMP | ✅ |

---

## 12. ChatRoom → chat_rooms

**파일**: `backend/src/main/java/com/farmbalance/chat/domain/ChatRoom.java`  
**테이블**: ✅ 존재  
**상속**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| userId | @Column NOT NULL (user_id) | user_id | BIGINT NOT NULL | ✅ |
| title | @Column NOT NULL VARCHAR(100) | title | VARCHAR(100) NOT NULL | ✅ |
| createdAt | @CreatedDate TIMESTAMP | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |

---

## 13. ChatMessage → chat_messages

**파일**: `backend/src/main/java/com/farmbalance/chat/domain/ChatMessage.java`  
**테이블**: ✅ 존재  
**상속**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| chatRoom | @ManyToOne @JoinColumn NOT NULL (chat_room_id) | chat_room_id | BIGINT NOT NULL REFERENCES chat_rooms ON DELETE CASCADE | ✅ |
| senderRole | @Enumerated STRING VARCHAR(20) NOT NULL (sender_role) | sender_role | VARCHAR(20) NOT NULL | ✅ |
| content | @Column TEXT NOT NULL | content | TEXT NOT NULL | ✅ |
| createdAt | @CreatedDate TIMESTAMP | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |

---

## 14. ProductCategoryJpaEntity → product_categories

**파일**: `backend/src/main/java/com/farmbalance/shop/adapter/out/persistence/entity/ProductCategoryJpaEntity.java`  
**테이블**: ✅ 존재  
**상속**: ❌ **BaseTimeEntity 미상속**

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| name | @Column NOT NULL UNIQUE VARCHAR(50) | name | VARCHAR(50) NOT NULL UNIQUE | ✅ |
| description | @Column VARCHAR(200) | description | VARCHAR(200) | ✅ |
| displayOrder | @Column int | display_order | INT DEFAULT 0 | ✅ |
| active | @Column boolean | is_active | BOOLEAN DEFAULT true | ✅ |
| **createdAt** | ❌ **NOT DEFINED** | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ❌ **MISSING** |
| **updatedAt** | ❌ **NOT DEFINED** | updated_at | TIMESTAMP | ❌ **MISSING** |
| **deletedAt** | ❌ **NOT DEFINED** | deleted_at | TIMESTAMP | ❌ **MISSING** |

### 발견된 문제
- ❌ **CRITICAL**: `createdAt`, `updatedAt`, `deletedAt` 필드 누락
  - 엔티티에 정의되지 않았으나 마이그레이션에는 존재
  - 결과: INSERT 실패 (NOT NULL 제약 위반) 또는 JPA 무시 (데이터 불일치)

### 권장 조치
ProductCategoryJpaEntity를 BaseTimeEntity 상속으로 변경:
```java
@Entity
@Table(name = "product_categories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductCategoryJpaEntity extends BaseTimeEntity {
    // ... fields ...
}
```

---

## 15. ProductJpaEntity → products

**파일**: `backend/src/main/java/com/farmbalance/shop/adapter/out/persistence/entity/ProductJpaEntity.java`  
**테이블**: ✅ 존재  
**상속**: BaseTimeEntity

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| sellerId | @Column NOT NULL (seller_id) | seller_id | BIGINT NOT NULL REFERENCES users | ✅ |
| categoryId | @Column (category_id) | category_id | BIGINT REFERENCES product_categories | ✅ |
| name | @Column NOT NULL VARCHAR(200) | name | VARCHAR(200) NOT NULL | ✅ |
| price | @Column NOT NULL int | price | INT NOT NULL | ✅ |
| stock | @Column NOT NULL int | stock | INT NOT NULL DEFAULT 0 | ✅ |
| description | @Column TEXT | description | TEXT | ✅ |
| salesCount | @Column NOT NULL int (sales_count) | sales_count | INT NOT NULL DEFAULT 0 | ✅ |
| status | @Column VARCHAR(20) | status | VARCHAR(20) DEFAULT 'PENDING' | ✅ |
| deletedAt | @Column TIMESTAMP (deleted_at) | deleted_at | TIMESTAMP | ✅ |
| createdAt | BaseTimeEntity | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |
| updatedAt | BaseTimeEntity | updated_at | TIMESTAMP | ✅ |

### 발견된 문제
- ✅ 문제 없음 (harvest_record_id FK는 엔티티에 없음 — 설계 변경)

---

## 16. OrderJpaEntity → orders

**파일**: `backend/src/main/java/com/farmbalance/shop/adapter/out/persistence/entity/OrderJpaEntity.java`  
**테이블**: ✅ 존재  
**상속**: BaseTimeEntity

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| buyerId | @Column NOT NULL (buyer_id) | buyer_id | BIGINT NOT NULL REFERENCES users | ✅ |
| orderNumber | @Column NOT NULL UNIQUE VARCHAR(30) (order_number) | order_number | VARCHAR(30) NOT NULL UNIQUE | ✅ |
| totalAmount | @Column NOT NULL int (total_amount) | total_amount | INT NOT NULL | ✅ |
| status | @Column VARCHAR(20) | status | VARCHAR(20) DEFAULT 'ORDERED' | ✅ |
| receiverName | @Column VARCHAR(50) (receiver_name) | receiver_name | VARCHAR(50) | ✅ |
| receiverPhone | @Column VARCHAR(20) (receiver_phone) | receiver_phone | VARCHAR(20) | ✅ |
| shippingAddress | @Column (shipping_address) | shipping_address | VARCHAR(255) | ✅ |
| shippingMemo | @Column VARCHAR(200) (shipping_memo) | shipping_memo | VARCHAR(200) | ✅ |
| trackingNumber | @Column VARCHAR(30) (tracking_number) | tracking_number | VARCHAR(30) | ✅ |
| shippedAt | @Column TIMESTAMP (shipped_at) | shipped_at | TIMESTAMP | ✅ |
| deletedAt | @Column TIMESTAMP (deleted_at) | deleted_at | TIMESTAMP | ✅ |
| createdAt | BaseTimeEntity | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |
| updatedAt | BaseTimeEntity | updated_at | TIMESTAMP | ✅ |

---

## 17. OrderItemJpaEntity → order_items

**파일**: `backend/src/main/java/com/farmbalance/shop/adapter/out/persistence/entity/OrderItemJpaEntity.java`  
**테이블**: ✅ 존재  
**상속**: BaseTimeEntity

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| order | @ManyToOne @JoinColumn NOT NULL (order_id) | order_id | BIGINT NOT NULL REFERENCES orders | ✅ |
| productId | @Column NOT NULL (product_id) | product_id | BIGINT NOT NULL REFERENCES products | ✅ |
| quantity | @Column NOT NULL int | quantity | INT NOT NULL | ✅ |
| unitPrice | @Column NOT NULL int (unit_price) | unit_price | INT NOT NULL | ✅ |
| subtotal | @Column NOT NULL int | subtotal | INT NOT NULL | ✅ |
| deletedAt | @Column TIMESTAMP (deleted_at) | deleted_at | TIMESTAMP | ✅ |
| createdAt | BaseTimeEntity | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |
| updatedAt | BaseTimeEntity | updated_at | TIMESTAMP | ✅ |

---

## 18. CartItemJpaEntity → cart_items

**파일**: `backend/src/main/java/com/farmbalance/shop/adapter/out/persistence/entity/CartItemJpaEntity.java`  
**테이블**: ✅ 존재  
**상족**: BaseTimeEntity

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| userId | @Column NOT NULL (user_id) | user_id | BIGINT NOT NULL REFERENCES users | ✅ |
| productId | @Column NOT NULL (product_id) | product_id | BIGINT NOT NULL REFERENCES products ON DELETE CASCADE | ✅ |
| quantity | @Column NOT NULL int | quantity | INT NOT NULL DEFAULT 1 | ✅ |
| deletedAt | @Column TIMESTAMP (deleted_at) | deleted_at | TIMESTAMP | ✅ |
| createdAt | BaseTimeEntity | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |
| updatedAt | BaseTimeEntity | updated_at | TIMESTAMP | ✅ |

### UNIQUE 제약 검증
- JPA: `@UniqueConstraint(columnNames = {"user_id", "product_id"})`
- DB: `UNIQUE (user_id, product_id)`
- ✅ 일치

---

## 19. UploadJpaEntity → uploads

**파일**: `backend/src/main/java/com/farmbalance/shop/adapter/out/persistence/entity/UploadJpaEntity.java`  
**테이블**: ✅ 존재  
**상속**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| entityType | @Column NOT NULL VARCHAR(30) (entity_type) | entity_type | VARCHAR(30) NOT NULL | ✅ |
| entityId | @Column NOT NULL (entity_id) | entity_id | BIGINT NOT NULL | ✅ |
| fileType | @Column NOT NULL VARCHAR(20) (file_type) | file_type | VARCHAR(20) NOT NULL DEFAULT 'IMAGE' | ✅ |
| fileUrl | @Column NOT NULL VARCHAR(500) (file_url) | file_url | VARCHAR(500) NOT NULL | ✅ |
| originalName | @Column VARCHAR(255) (original_name) | original_name | VARCHAR(255) | ✅ |
| displayOrder | @Column int (display_order) | display_order | INT DEFAULT 0 | ✅ |
| createdAt | @Column NOT NULL (created_at) | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |
| deletedAt | @Column TIMESTAMP (deleted_at) | deleted_at | TIMESTAMP | ✅ |

### INDEX 검증
- JPA: `@Index(name = "idx_uploads_entity", columnList = "entity_type, entity_id")`
- DB: **마이그레이션에 CREATE INDEX 없음** ⚠️
- 위험도: **MEDIUM** - 성능 영향 (권장 사항)

---

## 20. NotificationJpaEntity → notifications

**파일**: `backend/src/main/java/com/farmbalance/notification/adapter/out/persistence/entity/NotificationJpaEntity.java`  
**테이블**: ✅ 존재  
**상속**: BaseTimeEntity

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| userId | @Column NOT NULL (user_id) | user_id | BIGINT NOT NULL REFERENCES users | ✅ |
| type | @Column NOT NULL VARCHAR(20) | type | VARCHAR(20) NOT NULL | ✅ |
| title | @Column NOT NULL VARCHAR(200) | title | VARCHAR(200) NOT NULL | ✅ |
| message | @Column TEXT | message | TEXT | ✅ |
| link | @Column VARCHAR(500) | link | VARCHAR(500) | ✅ |
| isRead | @Column boolean (is_read) | is_read | BOOLEAN DEFAULT false | ✅ |
| deletedAt | @Column TIMESTAMP (deleted_at) | deleted_at | TIMESTAMP | ✅ |
| createdAt | BaseTimeEntity | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |
| updatedAt | BaseTimeEntity | updated_at | TIMESTAMP | ✅ |

---

## 21. FcmTokenJpaEntity → fcm_tokens

**파일**: `backend/src/main/java/com/farmbalance/notification/adapter/out/persistence/entity/FcmTokenJpaEntity.java`  
**테이블**: ✅ 존재 (V7 마이그레이션)  
**상속**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| userId | @Column NOT NULL (user_id) | user_id | BIGINT NOT NULL REFERENCES users ON DELETE CASCADE | ✅ |
| token | @Column NOT NULL VARCHAR(500) | token | VARCHAR(500) NOT NULL | ✅ |
| deviceType | @Column VARCHAR(20) (device_type) | device_type | VARCHAR(20) | ✅ |
| createdAt | @Column NOT NULL (created_at) | created_at | TIMESTAMP NOT NULL | ✅ |
| updatedAt | @Column (updated_at) | updated_at | TIMESTAMP | ✅ |

### INDEX 검증
- JPA: 없음
- DB: `CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens (user_id)`
- ⚠️ JPA에 인덱스 정의 없음 (DB에는 생성됨 — 괜찮음)

---

## 22. ReportJpaEntity → reports

**파일**: `backend/src/main/java/com/farmbalance/global/report/adapter/ReportJpaEntity.java`  
**테이블**: ✅ 존재  
**상속**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| targetType | @Column NOT NULL VARCHAR(20) (target_type) | target_type | VARCHAR(20) NOT NULL | ✅ |
| targetId | @Column NOT NULL (target_id) | target_id | BIGINT NOT NULL | ✅ |
| reporterId | @Column NOT NULL (reporter_id) | reporter_id | BIGINT NOT NULL REFERENCES users | ✅ |
| reason | @Column NOT NULL VARCHAR(500) | reason | VARCHAR(500) NOT NULL | ✅ |
| status | @Column NOT NULL VARCHAR(20) | status | VARCHAR(20) NOT NULL DEFAULT 'PENDING' | ✅ |
| createdAt | @CreatedDate TIMESTAMP | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |

### UNIQUE 제약 검증
- JPA: 없음
- DB: `UNIQUE (target_type, target_id, reporter_id)`
- ⚠️ JPA에 @UniqueConstraint 정의 없음 (DB에는 생성됨)
- 위험도: **MEDIUM** - 중복 INSERT 가능성

---

## 23. BatchLogJpaEntity → batch_logs

**파일**: `backend/src/main/java/com/farmbalance/policy/adapter/out/persistence/entity/BatchLogJpaEntity.java`  
**테이블**: ✅ 존재  
**상족**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| jobName | @Column NOT NULL VARCHAR(100) (job_name) | job_name | VARCHAR(100) NOT NULL | ✅ |
| status | @Column NOT NULL VARCHAR(50) | status | VARCHAR(50) NOT NULL | ✅ |
| totalProcessed | @Column int (total_processed) | total_processed | INT DEFAULT 0 | ✅ |
| totalFailed | @Column int (total_failed) | total_failed | INT DEFAULT 0 | ✅ |
| messages | @Column TEXT | messages | TEXT | ✅ |
| durationMs | @Column Long (duration_ms) | duration_ms | BIGINT | ✅ (V5 추가) |
| createdAt | @Column TIMESTAMP (created_at) | created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | ✅ |

---

## 24. PolicyDataJpaEntity → policy_data

**파일**: `backend/src/main/java/com/farmbalance/policy/adapter/out/persistence/entity/PolicyDataJpaEntity.java`  
**테이블**: ✅ 존재 (V9 마이그레이션)  
**상속**: BaseTimeEntity

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| externalId | @Column NOT NULL VARCHAR(200) (external_id) | external_id | VARCHAR(200) NOT NULL | ✅ |
| source | @Column VARCHAR(30) | source | VARCHAR(30) | ✅ |
| title | @Column VARCHAR(500) | title | VARCHAR(500) | ✅ |
| organization | @Column VARCHAR(200) | organization | VARCHAR(200) | ✅ |
| regionCode | @Column VARCHAR(10) (region_code) | region_code | VARCHAR(10) | ✅ |
| category | @Column VARCHAR(50) | category | VARCHAR(50) | ✅ |
| target | @Column VARCHAR(200) | target | VARCHAR(200) | ✅ |
| content | @Column TEXT | content | TEXT | ✅ |
| supportAmount | @Column VARCHAR(100) (support_amount) | support_amount | VARCHAR(100) | ✅ |
| applyStart | @Column DATE (apply_start) | apply_start | DATE | ✅ |
| applyEnd | @Column DATE (apply_end) | apply_end | DATE | ✅ |
| sourceUrl | @Column VARCHAR(1000) (source_url) | source_url | VARCHAR(1000) | ✅ |
| rawData | @JdbcTypeCode JSON (raw_data) | raw_data | JSONB | ✅ |
| normalizedData | @JdbcTypeCode JSON (normalized_data) | normalized_data | JSONB | ✅ |
| confidence | @Column precision=5 scale=2 BigDecimal | confidence | DECIMAL(5,2) | ✅ |
| fetchedAt | @Column NOT NULL TIMESTAMP (fetched_at) | fetched_at | TIMESTAMP NOT NULL | ✅ |
| data | @JdbcTypeCode JSON NOT NULL (data) | data | JSONB NOT NULL | ✅ |
| deletedAt | @Column TIMESTAMP (deleted_at) | deleted_at | TIMESTAMP | ✅ |
| createdAt | BaseTimeEntity | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |
| updatedAt | BaseTimeEntity | updated_at | TIMESTAMP | ✅ |

### UNIQUE 제약 검증
- JPA: `@UniqueConstraint(name = "uk_policy_data_external_source", columnNames = {"external_id", "source"})`
- DB: `CONSTRAINT uk_policy_data_external_source UNIQUE (external_id, source)`
- ✅ 일치

---

## 25. DownloadHistoryJpaEntity → download_history

**파일**: `backend/src/main/java/com/farmbalance/gov/adapter/out/persistence/entity/DownloadHistoryJpaEntity.java`  
**테이블**: ✅ 존재 (V6 마이그레이션)  
**상속**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| userId | @Column NOT NULL (user_id) | user_id | BIGINT NOT NULL REFERENCES users | ✅ |
| type | @Column NOT NULL VARCHAR(20) | type | VARCHAR(20) NOT NULL | ✅ |
| format | @Column NOT NULL VARCHAR(10) | format | VARCHAR(10) NOT NULL | ✅ |
| startDate | @Column LocalDate (start_date) | start_date | DATE | ✅ |
| endDate | @Column LocalDate (end_date) | end_date | DATE | ✅ |
| town | @Column VARCHAR(50) | town | VARCHAR(50) | ✅ |
| createdAt | @Column (created_at) @PrePersist | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |

### INDEX 검증
- JPA: 없음
- DB: `CREATE INDEX idx_download_history_user_created ON download_history (user_id, created_at DESC)`
- ⚠️ JPA에 @Index 정의 없음 (성능 최적화 권장)

---

## 26. RecommendHistoryEntity → recommend_history

**파일**: `backend/src/main/java/com/farmbalance/recommend/adapter/out/persistence/RecommendHistoryEntity.java`  
**테이블**: ✅ 존재  
**상족**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGINT GENERATED ALWAYS AS IDENTITY | ✅ |
| farmId | @Column Long | farm_id | BIGINT NOT NULL | ✅ |
| farmName | @Column String (farm_name) | farm_name | VARCHAR(255) | ✅ |
| farmAddress | @Column String (farm_address) | farm_address | VARCHAR(255) | ✅ |
| farmArea | @Column Double (farm_area) | farm_area | DOUBLE PRECISION | ✅ |
| soilPh | @Column Double (soil_ph) | soil_ph | DOUBLE PRECISION | ✅ |
| organicMatter | @Column Double (organic_matter) | organic_matter | DOUBLE PRECISION | ✅ |
| soilType | @Column String (soil_type) | soil_type | VARCHAR(100) | ✅ |
| generatedAt | @Column TIMESTAMP (generated_at) | generated_at | TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP | ✅ |
| **w_soil** | ❌ **NOT DEFINED** | w_soil | DOUBLE PRECISION | ❌ **MISSING** |
| **w_price** | ❌ **NOT DEFINED** | w_price | DOUBLE PRECISION | ❌ **MISSING** |
| **w_supply** | ❌ **NOT DEFINED** | w_supply | DOUBLE PRECISION | ❌ **MISSING** |
| **w_difficulty** | ❌ **NOT DEFINED** | w_difficulty | DOUBLE PRECISION | ❌ **MISSING** |
| **score_includes_climate** | ❌ **NOT DEFINED** | score_includes_climate | BOOLEAN | ❌ **MISSING** |

### 발견된 문제
- ❌ **CRITICAL**: 5개 필드 누락
  - `w_soil`, `w_price`, `w_supply`, `w_difficulty` (DOUBLE PRECISION)
  - `score_includes_climate` (BOOLEAN)
  - INSERT 성공하지만 데이터 손실 가능성

### 권장 조치
RecommendHistoryEntity에 필드 추가:
```java
@Column(name = "w_soil")
private Double wSoil;

@Column(name = "w_price")
private Double wPrice;

@Column(name = "w_supply")
private Double wSupply;

@Column(name = "w_difficulty")
private Double wDifficulty;

@Column(name = "score_includes_climate")
private Boolean scoreIncludesClimate;
```

---

## 27. RecommendHistoryItemEntity → recommend_history_item

**파일**: `backend/src/main/java/com/farmbalance/recommend/adapter/out/persistence/RecommendHistoryItemEntity.java`  
**테이블**: ✅ 존재  
**상족**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGINT GENERATED ALWAYS AS IDENTITY | ✅ |
| history | @ManyToOne @JoinColumn (history_id) | history_id | BIGINT NOT NULL REFERENCES recommend_history ON DELETE CASCADE | ✅ |
| cropId | @Column Long (crop_id) | crop_id | BIGINT | ✅ |
| cropName | @Column String (crop_name) | crop_name | VARCHAR(100) | ✅ |
| category | @Column String | category | VARCHAR(50) | ✅ |
| rank | @Column Integer name=`rank` | "rank" | INT | ✅ |
| score | @Column Integer | score | INT | ✅ |
| soilFitness | @Column String (soil_fitness) | soil_fitness | VARCHAR(50) | ✅ |
| soilFitnessPercent | @Column Integer (soil_fitness_percent) | soil_fitness_percent | INT | ✅ |
| priceForecastPercent | @Column Integer (price_forecast_percent) | price_forecast_percent | INT | ✅ |
| supplyStabilityPercent | @Column Integer (supply_stability_percent) | supply_stability_percent | INT | ✅ |
| supplyStatus | @Column String (supply_status) | supply_status | VARCHAR(50) | ✅ |
| expectedRevenuePerKg | @Column Integer (expected_revenue_per_kg) | expected_revenue_per_kg | INT | ✅ |
| expectedYield | @Column Integer (expected_yield) | expected_yield | INT | ✅ |
| aiReason | @Column String (ai_reason) | ai_reason | TEXT | ✅ |
| difficulty | @Column Integer | difficulty | INT | ✅ |
| growthDays | @Column Integer (growth_days) | growth_days | INT | ✅ |
| optimalTemp | @Column String (optimal_temp) | optimal_temp | VARCHAR(100) | ✅ |
| sowingPeriod | @Column String (sowing_period) | sowing_period | VARCHAR(100) | ✅ |
| harvestPeriod | @Column String (harvest_period) | harvest_period | VARCHAR(100) | ✅ |
| pests | @Column String | pests | TEXT | ✅ |
| **kpiSourcesNote** | ❌ **NOT DEFINED** | kpi_sources_note | VARCHAR(1024) | ❌ **MISSING** |
| **climateF itnessPer cent** | ❌ **NOT DEFINED** | climate_fitness_percent | INT | ❌ **MISSING** |

### 발견된 문제
- ❌ **MEDIUM**: 2개 필드 누락
  - `kpiSourcesNote` (VARCHAR(1024))
  - `climateF itnessPer cent` (INT)

### 권장 조치
필드 추가:
```java
@Column(name = "kpi_sources_note", length = 1024)
private String kpiSourcesNote;

@Column(name = "climate_fitness_percent")
private Integer climateFitnessPer cent;
```

---

## 28. CropPriceCacheEntity → crop_price_cache

**파일**: `backend/src/main/java/com/farmbalance/recommend/adapter/out/persistence/CropPriceCacheEntity.java`  
**테이블**: ✅ 존재  
**상족**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| cropName | @Column NOT NULL VARCHAR(50) (crop_name) | crop_name | VARCHAR(50) NOT NULL | ✅ |
| price | @Column NOT NULL int | price | INT NOT NULL | ✅ |
| unit | @Column NOT NULL VARCHAR(20) | unit | VARCHAR(20) NOT NULL | ✅ |
| priceDate | @Column NOT NULL LocalDate (price_date) | price_date | DATE NOT NULL | ✅ |
| createdAt | @CreatedDate TIMESTAMP NOT NULL (created_at) | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |

---

## 29. RagCategoryJpaEntity → rag_categories

**파일**: `backend/src/main/java/com/farmbalance/admin/adapter/out/persistence/entity/RagCategoryJpaEntity.java`  
**테이블**: ✅ 존재 (V8 마이그레이션)  
**상족**: 없음 (직접 @CreatedDate/@LastModifiedDate)

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| name | @Column NOT NULL UNIQUE VARCHAR(50) | name | VARCHAR(50) NOT NULL UNIQUE | ✅ |
| description | @Column VARCHAR(200) | description | VARCHAR(200) | ✅ |
| displayOrder | @Column int (display_order) | display_order | INTEGER DEFAULT 0 | ✅ |
| isActive | @Column boolean (is_active) | is_active | BOOLEAN DEFAULT TRUE | ✅ |
| createdAt | @CreatedDate TIMESTAMP | created_at | TIMESTAMP | ✅ |
| updatedAt | @LastModifiedDate TIMESTAMP | updated_at | TIMESTAMP | ✅ |
| deletedAt | @Column TIMESTAMP (deleted_at) | deleted_at | TIMESTAMP | ✅ |

---

## 30. RagDocumentJpaEntity → rag_documents

**파일**: `backend/src/main/java/com/farmbalance/admin/adapter/out/persistence/entity/RagDocumentJpaEntity.java`  
**테이블**: ✅ 존재 (V8 마이그레이션)  
**상족**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| userId | @Column NOT NULL | user_id | BIGINT NOT NULL | ✅ |
| categoryId | @Column NOT NULL (category_id) | category_id | BIGINT NOT NULL REFERENCES rag_categories | ✅ |
| title | @Column NOT NULL VARCHAR(200) | title | VARCHAR(200) NOT NULL | ✅ |
| contentType | @Enumerated STRING VARCHAR(10) NOT NULL (content_type) | content_type | VARCHAR(10) NOT NULL | ✅ |
| textContent | @Column TEXT (text_content) | text_content | TEXT | ✅ |
| fileUrl | @Column VARCHAR(500) (file_url) | file_url | VARCHAR(500) | ✅ |
| fileName | @Column VARCHAR(200) (file_name) | file_name | VARCHAR(200) | ✅ |
| fileType | @Enumerated STRING VARCHAR(10) (file_type) | file_type | VARCHAR(10) | ✅ |
| status | @Enumerated STRING VARCHAR(20) NOT NULL | status | VARCHAR(20) NOT NULL | ✅ |
| createdAt | @CreatedDate TIMESTAMP | created_at | TIMESTAMP | ✅ |
| updatedAt | @LastModifiedDate TIMESTAMP | updated_at | TIMESTAMP | ✅ |
| deletedAt | @Column TIMESTAMP | deleted_at | TIMESTAMP | ✅ |

---

## 31. CropProductionStatsJpaEntity → crop_production_stats

**파일**: `backend/src/main/java/com/farmbalance/balance/adapter/out/persistence/entity/CropProductionStatsJpaEntity.java`  
**테이블**: ✅ 존재  
**상족**: BaseTimeEntity

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| itmNm | @Column NOT NULL VARCHAR(50) (itm_nm) | itm_nm | VARCHAR(50) NOT NULL | ✅ |
| regionCode | @Column NOT NULL VARCHAR(10) (region_code) | region_code | VARCHAR(10) NOT NULL | ✅ |
| regionName | @Column VARCHAR(20) (region_name) | region_name | VARCHAR(20) | ✅ |
| year | @Column NOT NULL int | year | INT NOT NULL | ✅ |
| cultivatedArea | @Column BigDecimal (cultivated_area) | cultivated_area | DECIMAL(12,2) | ✅ |
| yieldPer10a | @Column BigDecimal (yield_per_10a) | yield_per_10a | DECIMAL(10,2) | ✅ |
| totalProduction | @Column BigDecimal (total_production) | total_production | DECIMAL(14,2) | ✅ |
| unitNm | @Column VARCHAR(10) (unit_nm) | unit_nm | VARCHAR(10) | ✅ |
| deletedAt | @Column TIMESTAMP (deleted_at) | deleted_at | TIMESTAMP | ✅ |
| createdAt | BaseTimeEntity | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |
| updatedAt | BaseTimeEntity | updated_at | TIMESTAMP | ✅ |

---

## 32. ApiSyncStatusJpaEntity → api_sync_status

**파일**: `backend/src/main/java/com/farmbalance/admin/adapter/out/persistence/entity/ApiSyncStatusJpaEntity.java`  
**테이블**: ✅ 존재  
**상족**: 없음

### 컬럼 비교

| Java 필드 | JPA 정의 | DB 컬럼 | DB 타입 | 일치 |
|---|---|---|---|---|
| id | @GeneratedValue IDENTITY | id | BIGSERIAL PK | ✅ |
| apiName | @Column NOT NULL UNIQUE VARCHAR(50) (api_name) | api_name | VARCHAR(50) NOT NULL UNIQUE | ✅ |
| displayName | @Column NOT NULL VARCHAR(100) (display_name) | display_name | VARCHAR(100) NOT NULL | ✅ |
| lastSynced | @Column TIMESTAMP (last_synced) | last_synced | TIMESTAMP | ✅ |
| lastHealthChecked | @Column TIMESTAMP (last_health_checked) | last_health_checked | TIMESTAMP | ✅ |
| syncStatus | @Column VARCHAR(20) (sync_status) | sync_status | VARCHAR(20) DEFAULT 'PENDING' | ✅ |
| lastRecordCount | @Column int (last_record_count) | last_record_count | INT | ✅ |
| errorMessage | @Column TEXT (error_message) | error_message | TEXT | ✅ |
| isActive | @Column boolean (is_active) | is_active | BOOLEAN DEFAULT true | ✅ |
| createdAt | @CreatedDate TIMESTAMP | created_at | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ |
| updatedAt | @LastModifiedDate TIMESTAMP | updated_at | TIMESTAMP | ✅ |
| deletedAt | @Column TIMESTAMP | deleted_at | TIMESTAMP | ✅ |

---

## 33. Nongsaro 및 기타 데이터 테이블

다음 테이블들은 `@Entity`가 없고 READ-ONLY 마이그레이션 데이터로 관리됨:
- nongsaro_varieties
- nongsaro_farm_schedules
- pest_occurrence_reports
- nongsaro_disaster_prevention
- nongsaro_eco_farming
- nongsaro_advanced_tech
- crop_guides
- crop_categories (쿼리용)
- crops (쿼리용)
- crop_cultivation_env (쿼리용)
- regions (쿼리용)
- weather_data (쿼리용)
- soil_exam_data (쿼리용)
- soil_fitness_data (쿼리용)
- balance_data (쿼리용)

✅ 이들 테이블은 JPA 엔티티 없음 (의도된 설계)

---

## 34. Graph Domain - CRITICAL ISSUE

**검색 결과**: PolicyGraphPersistenceAdapter에서 `graph.graph_relation` 참조
**테이블**: ❌ **마이그레이션에 없음**
**상족**: 엔티티 없음

### 발견된 문제
- ❌ **CRITICAL**: `graph.graph_relation` 테이블이 DB에 없음
  - 파일: PolicyGraphPersistenceAdapter.java
  - 코드: policy_graph (정책 그래프) 기능에서 사용
  - 영향: **런타임 에러 (테이블 없음)**

### 권장 조치
마이그레이션에 추가 필요. V13 마이그레이션 (또는 V1 보정):
```sql
-- CREATE SCHEMA IF NOT EXISTS graph; (V1에 이미 있음)

CREATE TABLE graph.graph_relation (
    id BIGSERIAL PRIMARY KEY,
    source_entity_id BIGINT NOT NULL REFERENCES graph.graph_entity(id) ON DELETE CASCADE,
    target_entity_id BIGINT NOT NULL REFERENCES graph.graph_entity(id) ON DELETE CASCADE,
    relation_type VARCHAR(50) NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_graph_relation_source ON graph.graph_relation(source_entity_id);
CREATE INDEX idx_graph_relation_target ON graph.graph_relation(target_entity_id);
```

---

## 종합 요약

### 검사 통계
- **검사한 엔티티**: 34개 (직접 @Entity 33개 + 데이터 테이블 1개)
- **문제 없음**: 28개 (82.4%)
- **CRITICAL**: 4개
- **HIGH (성능)**: 1개
- **MEDIUM (설계)**: 3개

### CRITICAL 문제 (Hibernate Validate 실패 또는 런타임 에러)

1. **ProductCategoryJpaEntity → product_categories**
   - 누락 필드: `createdAt`, `updatedAt`, `deletedAt` (3개)
   - 원인: BaseTimeEntity 미상속
   - 영향: INSERT 실패 (NOT NULL 제약 위반)

2. **RecommendHistoryEntity → recommend_history**
   - 누락 필드: `wSoil`, `wPrice`, `wSupply`, `wDifficulty`, `scoreIncludesClimate` (5개)
   - 원인: 필드 누락
   - 영향: 데이터 손실 또는 INSERT 부분 실패

3. **RecommendHistoryItemEntity → recommend_history_item**
   - 누락 필드: `kpiSourcesNote`, `climateFitnessPer cent` (2개)
   - 원인: 필드 누락
   - 영향: 데이터 손실

4. **Graph Domain - graph.graph_relation**
   - 누락 테이블: `graph.graph_relation`
   - 원인: 마이그레이션 DDL 누락
   - 영향: 정책 그래프 쿼리 런타임 에러 (테이블 없음)

### HIGH 문제 (성능 최적화)

1. **UploadJpaEntity**
   - INDEX 미정의 (JPA 레벨)
   - DB에는 CREATE INDEX 있음 (문제 없음)

### MEDIUM 문제 (설계 불일치)

1. **PostEntity.title**
   - Length 불일치: JPA 100 vs DB 200
   - 영향: 200자 DB 데이터가 100자 제약으로 읽음 (JPA 로드 후 저장 시 손실)

2. **DownloadHistoryJpaEntity**
   - INDEX 미정의 (성능: findTop10ByUserIdOrderByCreatedAtDesc)
   - DB에는 CREATE INDEX 있음 (문제 없음)

3. **ReportJpaEntity**
   - UNIQUE 제약 미정의 (JPA 레벨)
   - DB에는 UNIQUE 있음
   - 영향: 중복 INSERT 방지 실패 (JPA 레벨)

---

## 권장 우선순위

### P0 (즉시 해결)
1. ProductCategoryJpaEntity - BaseTimeEntity 상속 추가
2. RecommendHistoryEntity - 5개 필드 추가
3. RecommendHistoryItemEntity - 2개 필드 추가
4. graph.graph_relation 테이블 마이그레이션 추가

### P1 (이번 릴리스)
1. PostEntity.title length 수정 (JPA 200으로 변경)
2. ReportJpaEntity - @UniqueConstraint 추가

### P2 (향후 개선)
1. UploadJpaEntity - @Index 추가
2. DownloadHistoryJpaEntity - @Index 추가
3. 기타 인덱스 정의 검토

---

## 결론

**이전 감사 보고서의 false positive 확인**:
- farm_crops 테이블 → 코드 확인 결과 cultivation_registrations로 완전히 전환됨 (FALSE POSITIVE) ✅

**새로운 진짜 문제 4개 발견**:
- ProductCategoryJpaEntity, RecommendHistoryEntity, RecommendHistoryItemEntity의 필드 누락
- graph.graph_relation 테이블 완전 누락

이 4개 문제는 **즉시 해결**이 필요하며, 특히 graph.graph_relation은 정책 그래프 기능의 런타임 에러를 초래합니다.
