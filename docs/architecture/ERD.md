# 🌱 FarmBalance — ERD (Entity-Relationship Diagram)

> **기반 문서**: 전체_통합.md (13개 엔티티)
> **DB**: PostgreSQL 16
> **ORM**: Spring Data JPA (Hibernate)
> **네이밍**: snake_case (DB) ↔ camelCase (Java Entity)

---

## 1. ER 다이어그램

```mermaid
erDiagram
    %% ===== 유저 도메인 =====
    users {
        bigint id PK
        varchar email UK
        varchar password
        varchar name
        varchar phone
        varchar role "GENERAL | FARMER | ADMIN | GOV"
        varchar region
        varchar status "ACTIVE | SUSPENDED"
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    farms {
        bigint id PK
        bigint user_id FK
        varchar name
        varchar address
        decimal area_size "㎡"
        varchar soil_type
        varchar business_number "사업자 등록번호"
        varchar land_cert_image_url
        boolean land_cert_verified
        varchar status "PENDING | APPROVED | REJECTED"
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    %% ===== 작물 도메인 =====
    crops {
        bigint id PK
        varchar code UK "ex: RICE_001"
        varchar name
        varchar category "곡류 | 채소 | 과일 | 특용"
        int growth_days
        decimal yield_per_sqm "㎡당 수확량(kg)"
        decimal avg_cost_per_sqm "㎡당 평균 비용(원)"
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    seed_registrations {
        bigint id PK
        bigint farm_id FK
        bigint crop_id FK
        varchar seed_type "SEED | SEEDLING | SAPLING"
        int quantity
        decimal estimated_yield "예상 총 수확량"
        varchar yield_unit "g | kg | ton"
        varchar receipt_image_url
        boolean verified
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }



    %% ===== 수급 도메인 =====
    balance_data {
        bigint id PK
        varchar region_code
        bigint crop_id FK
        int year
        varchar season "SPRING | SUMMER | AUTUMN | WINTER"
        decimal supply_forecast
        decimal demand_forecast
        decimal supply_ratio "공급/수요 비율(%)"
        varchar balance_status "EXCESS_WARN | EXCESS_CAUTION | BALANCED | SHORT_CAUTION | SHORT_WARN"
        timestamp calculated_at
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    %% ===== 상점 도메인 =====
    products {
        bigint id PK
        bigint seller_id FK
        varchar name
        varchar category "채소 | 과일 | 곡물 | 가공식품 | 농기구 | 기타"
        decimal price
        int stock
        text description
        varchar image_url
        varchar status "PENDING | ACTIVE | INACTIVE | REJECTED"
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    orders {
        bigint id PK
        bigint buyer_id FK
        varchar order_number UK
        decimal total_amount
        varchar status "ORDERED | ACCEPTED | SHIPPED | COMPLETED | CANCELLED"
        varchar receiver_name "받는 분"
        varchar receiver_phone "연락처"
        varchar shipping_address
        varchar shipping_memo "배송 메모"
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    order_items {
        bigint id PK
        bigint order_id FK
        bigint product_id FK
        int quantity
        decimal unit_price
        decimal subtotal
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    cart_items {
        bigint id PK
        bigint user_id FK
        bigint product_id FK
        int quantity
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    %% ===== 커뮤니티 도메인 =====
    posts {
        bigint id PK
        bigint author_id FK
        varchar title
        text content
        varchar category "FREE | INFO | QNA"
        int view_count
        boolean is_notice
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
    }

    comments {
        bigint id PK
        bigint post_id FK
        bigint author_id FK
        text content
        boolean accepted "답변 채택 여부"
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
    }

    %% ===== 정책 도메인 =====

    policy_data {
        bigint id PK
        varchar external_id "외부 API 제공 정책 고유번호"
        jsonb data "정책 API 응답 원본 JSON"
        timestamp fetched_at "수집 시각"
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }


    %% ===== 알림 도메인 =====
    guide_messages {
        bigint id PK
        bigint sender_id FK "관리자/지자체"
        varchar target_type "ALL | REGION | CROP | USER"
        varchar target_value "지역코드 or 작물코드 등"
        varchar title
        text content
        varchar channel "IN_APP | SMS | EMAIL"
        timestamp sent_at
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    notifications {
        bigint id PK
        bigint user_id FK
        varchar type "BALANCE_WARN | GUIDE | ORDER | POLICY | SYSTEM"
        varchar title
        text message
        varchar link
        boolean is_read
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    %% ===== 관계 정의 =====
    users ||--o{ farms : "소유"
    users ||--o{ products : "판매"
    users ||--o{ orders : "주문"
    users ||--o{ cart_items : "장바구니"
    users ||--o{ posts : "작성"
    users ||--o{ comments : "작성"
    users ||--o{ notifications : "수신"

    farms ||--o{ seed_registrations : "종자등록"

    crops ||--o{ seed_registrations : "작물참조"
    crops ||--o{ balance_data : "수급데이터"

    orders ||--|{ order_items : "주문항목"
    products ||--o{ order_items : "상품참조"
    products ||--o{ cart_items : "상품참조"

    posts ||--o{ comments : "댓글"


    users ||--o{ guide_messages : "발송"
```

---

## 2. 테이블 상세 명세

### 2.1 users (유저)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, AUTO | 유저 고유 ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 이메일 (로그인 ID) |
| password | VARCHAR(255) | NOT NULL | BCrypt 해싱 |
| name | VARCHAR(50) | NOT NULL | 이름 |
| phone | VARCHAR(20) | | 전화번호 |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'GENERAL' | GENERAL / FARMER / ADMIN / GOV |
| region | VARCHAR(50) | | 지역 (양평군 등) |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | ACTIVE / SUSPENDED |
| created_at | TIMESTAMP | NOT NULL | 가입일 |
| updated_at | TIMESTAMP | | 수정일 |
| deleted_at | TIMESTAMP | | 삭제 시각 |

### 2.2 farms (농장)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, AUTO | 농장 고유 ID |
| user_id | BIGINT | FK → users(id), NOT NULL | 소유자 |
| name | VARCHAR(100) | NOT NULL | 농장명 |
| address | VARCHAR(255) | NOT NULL | 농장 주소 |
| area_size | DECIMAL(10,2) | NOT NULL | 면적 (㎡) |
| soil_type | VARCHAR(50) | | 토양 유형 |
| business_number | VARCHAR(12) | | 사업자 등록번호 |
| land_cert_image_url | VARCHAR(500) | | 토지증명서 이미지/PDF URL |
| land_cert_verified | BOOLEAN | DEFAULT false | 관리자 토지증명서 검증 완료 여부 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | PENDING / APPROVED / REJECTED |
| created_at | TIMESTAMP | NOT NULL | 등록일 |
| updated_at | TIMESTAMP | | 수정일 |
| deleted_at | TIMESTAMP | | 삭제 시각 |

### 2.3 crops (작물 마스터)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, AUTO | 작물 고유 ID |
| code | VARCHAR(30) | UNIQUE, NOT NULL | 작물 코드 (ex: RICE_001) |
| name | VARCHAR(50) | NOT NULL | 작물명 |
| category | VARCHAR(20) | NOT NULL | 곡류 / 채소 / 과일 / 특용 |
| growth_days | INT | | 재배 기간 (일) |
| yield_per_sqm | DECIMAL(10,2) | | ㎡당 수확량 (kg) |
| avg_cost_per_sqm | DECIMAL(10,2) | | ㎡당 평균 비용 (원) |
| is_active | BOOLEAN | DEFAULT true | 활성 여부 |
| created_at | TIMESTAMP | NOT NULL | 등록일 |
| updated_at | TIMESTAMP | | 수정일 |
| deleted_at | TIMESTAMP | | 삭제 시각 |

### 2.4 seed_registrations (종자 등록)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, AUTO | 종자 등록 고유 ID |
| farm_id | BIGINT | FK → farms(id), NOT NULL | 농장 |
| crop_id | BIGINT | FK → crops(id), NOT NULL | 작물 |
| seed_type | VARCHAR(20) | NOT NULL | SEED(씨앗) / SEEDLING(종자) / SAPLING(모종) |
| quantity | INT | NOT NULL | 수량 |
| estimated_yield | DECIMAL(12,2) | | 예상 총 수확량 |
| yield_unit | VARCHAR(10) | | 수확량 단위 (g / kg / ton) |
| receipt_image_url | VARCHAR(500) | | 영수증 사진 URL |
| verified | BOOLEAN | DEFAULT false | 인증 여부 |
| created_at | TIMESTAMP | NOT NULL | 등록일 |
| updated_at | TIMESTAMP | | 수정일 |
| deleted_at | TIMESTAMP | | 삭제 시각 |

### 2.5 balance_data (수급 데이터)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, AUTO | 수급 데이터 고유 ID |
| region_code | VARCHAR(20) | NOT NULL | 지역 코드 |
| crop_id | BIGINT | FK → crops(id), NOT NULL | 작물 |
| year | INT | NOT NULL | 연도 |
| season | VARCHAR(10) | NOT NULL | SPRING / SUMMER / AUTUMN / WINTER |
| supply_forecast | DECIMAL(12,2) | | 공급 예측량 |
| demand_forecast | DECIMAL(12,2) | | 수요 예측량 |
| supply_ratio | DECIMAL(5,2) | | 수급 비율 (%) |
| balance_status | VARCHAR(20) | | EXCESS_WARN / EXCESS_CAUTION / BALANCED / SHORT_CAUTION / SHORT_WARN |
| calculated_at | TIMESTAMP | | 최종 계산 시각 |
| created_at | TIMESTAMP | NOT NULL | 생성일 |
| updated_at | TIMESTAMP | | 수정일 |
| deleted_at | TIMESTAMP | | 삭제 시각 |

> **UNIQUE 제약**: (region_code, crop_id, year, season) 복합 유니크

### 2.6 products (상품)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, AUTO | 상품 고유 ID |
| seller_id | BIGINT | FK → users(id), NOT NULL | 판매자 |
| name | VARCHAR(100) | NOT NULL | 상품명 |
| category | VARCHAR(20) | | 채소 / 과일 / 곡물 / 가공식품 / 농기구 / 기타 |
| price | DECIMAL(10,2) | NOT NULL | 가격 (원) |
| stock | INT | NOT NULL, DEFAULT 0 | 재고 |
| description | TEXT | | 상품 설명 |
| image_url | VARCHAR(500) | | 상품 이미지 URL |
| status | VARCHAR(20) | DEFAULT 'PENDING' | PENDING / ACTIVE / INACTIVE / REJECTED |
| created_at | TIMESTAMP | NOT NULL | 등록일 |
| updated_at | TIMESTAMP | | 수정일 |
| deleted_at | TIMESTAMP | | 삭제 시각 |

### 2.7 orders (주문)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, AUTO | 주문 고유 ID |
| buyer_id | BIGINT | FK → users(id), NOT NULL | 구매자 |
| order_number | VARCHAR(30) | UNIQUE, NOT NULL | 주문 번호 |
| total_amount | DECIMAL(12,2) | NOT NULL | 총 금액 |
| status | VARCHAR(20) | DEFAULT 'ORDERED' | ORDERED / ACCEPTED / SHIPPED / COMPLETED / CANCELLED |
| receiver_name | VARCHAR(50) | | 받는 분 |
| receiver_phone | VARCHAR(20) | | 받는 분 연락처 |
| shipping_address | VARCHAR(255) | | 배송 주소 |
| shipping_memo | VARCHAR(200) | | 배송 메모 |
| created_at | TIMESTAMP | NOT NULL | 주문일 |
| updated_at | TIMESTAMP | | 수정일 |
| deleted_at | TIMESTAMP | | 삭제 시각 |

### 2.8 order_items (주문 항목)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, AUTO | 주문 항목 고유 ID |
| order_id | BIGINT | FK → orders(id), NOT NULL | 주문 |
| product_id | BIGINT | FK → products(id), NOT NULL | 상품 |
| quantity | INT | NOT NULL | 수량 |
| unit_price | DECIMAL(10,2) | NOT NULL | 단가 (주문 시점 스냅샷) |
| subtotal | DECIMAL(10,2) | NOT NULL | 소계 |
| created_at | TIMESTAMP | NOT NULL | 생성일 |
| updated_at | TIMESTAMP | | 수정일 |
| deleted_at | TIMESTAMP | | 삭제 시각 |

### 2.9 cart_items (장바구니)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, AUTO | 장바구니 고유 ID |
| user_id | BIGINT | FK → users(id), NOT NULL | 유저 |
| product_id | BIGINT | FK → products(id), NOT NULL | 상품 |
| quantity | INT | NOT NULL, DEFAULT 1 | 수량 |
| created_at | TIMESTAMP | NOT NULL | 담은 시각 |
| updated_at | TIMESTAMP | | 수정일 |
| deleted_at | TIMESTAMP | | 삭제 시각 |

> **UNIQUE 제약**: (user_id, product_id) 복합 유니크

### 2.10 posts (게시글)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, AUTO | 게시글 고유 ID |
| author_id | BIGINT | FK → users(id), NOT NULL | 작성자 |
| title | VARCHAR(200) | NOT NULL | 제목 |
| content | TEXT | NOT NULL | 본문 |
| category | VARCHAR(10) | NOT NULL | FREE / INFO / QNA |
| view_count | INT | DEFAULT 0 | 조회수 |
| is_notice | BOOLEAN | DEFAULT false | 공지 여부 |
| deleted_at | TIMESTAMP | | 삭제 시각 (null이면 미삭제) |
| created_at | TIMESTAMP | NOT NULL | 작성일 |
| updated_at | TIMESTAMP | | 수정일 |

### 2.11 comments (댓글)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, AUTO | 댓글 고유 ID |
| post_id | BIGINT | FK → posts(id), NOT NULL | 게시글 |
| author_id | BIGINT | FK → users(id), NOT NULL | 작성자 |
| content | TEXT | NOT NULL | 댓글 내용 |
| accepted | BOOLEAN | DEFAULT false | 답변 채택 여부 (Q&A) |
| deleted_at | TIMESTAMP | | 삭제 시각 (null이면 미삭제) |
| created_at | TIMESTAMP | NOT NULL | 작성일 |
| updated_at | TIMESTAMP | | 수정일 |

### 2.12 policy_data (정책 API 데이터 저장소)

외부 정책 API에서 수집한 데이터를 JSON 원본 그대로 저장하는 테이블입니다. 정책 API 응답 스키마가 사전에 확정되지 않으므로 정규화하지 않고 JSONB로 저장하며, AI Agent의 Tool이 데이터를 조회하여 활용합니다.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, AUTO | 내부 고유 ID |
| external_id | VARCHAR(200) | UNIQUE, NOT NULL | 외부 API 제공 정책 고유번호 |
| data | JSONB | NOT NULL | 정책 API 응답 원본 (항목 1건의 JSON) |
| fetched_at | TIMESTAMP | NOT NULL | 수집 시각 |
| created_at | TIMESTAMP | NOT NULL | 등록일 |
| updated_at | TIMESTAMP | | 수정일 |
| deleted_at | TIMESTAMP | | 삭제 시각 |

> **설계 근거**: 정책 API 응답 스키마가 사전에 확정되지 않으므로 정규화된 컬럼 대신 JSONB로 원본을 저장합니다. AI Agent Tool이 이 데이터를 조회하여 LLM에 전달하는 방식으로 활용됩니다. 다른 외부 API(통계, 기상 등)의 데이터 테이블은 추후 필요 시 별도로 추가합니다.

### 2.13 guide_messages (권고 메시지)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, AUTO | 메시지 고유 ID |
| sender_id | BIGINT | FK → users(id), NOT NULL | 발송자 (관리자/지자체) |
| target_type | VARCHAR(10) | NOT NULL | ALL / REGION / CROP / USER |
| target_value | VARCHAR(50) | | 대상 값 (지역코드, 작물코드 등) |
| title | VARCHAR(200) | NOT NULL | 제목 |
| content | TEXT | NOT NULL | 내용 |
| channel | VARCHAR(10) | NOT NULL | IN_APP / SMS / EMAIL |
| sent_at | TIMESTAMP | | 발송 시각 |
| created_at | TIMESTAMP | NOT NULL | 생성일 |
| updated_at | TIMESTAMP | | 수정일 |
| deleted_at | TIMESTAMP | | 삭제 시각 |

### 2.14 notifications (알림)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, AUTO | 알림 고유 ID |
| user_id | BIGINT | FK → users(id), NOT NULL | 수신자 |
| type | VARCHAR(20) | NOT NULL | BALANCE_WARN / GUIDE / ORDER / POLICY / SYSTEM |
| title | VARCHAR(200) | NOT NULL | 알림 제목 |
| message | TEXT | | 알림 내용 |
| link | VARCHAR(500) | | 이동 링크 |
| is_read | BOOLEAN | DEFAULT false | 읽음 여부 |
| created_at | TIMESTAMP | NOT NULL | 생성일 |
| updated_at | TIMESTAMP | | 수정일 |
| deleted_at | TIMESTAMP | | 삭제 시각 |

---

## 3. 핵심 관계 요약

| 관계 | 카디널리티 | 설명 |
|------|-----------|------|
| users → farms | 1:N | 유저 한 명이 여러 농장 소유 가능 |
| farms → seed_registrations | 1:N | 농장별 여러 종자 등록 |
| crops → balance_data | 1:N | 작물별 지역·시즌 수급 데이터 |
| users → products | 1:N | 판매자가 여러 상품 등록 |
| users → orders | 1:N | 구매자가 여러 주문 |
| orders → order_items | 1:N | 주문 1건에 여러 항목 |
| users → posts | 1:N | 유저가 여러 게시글 작성 |
| posts → comments | 1:N | 게시글에 여러 댓글 |
| users → notifications | 1:N | 유저에게 여러 알림 |

---

## 4. 인덱스 권장

```sql
-- 유저 조회
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_region ON users(region);

-- 농장
CREATE INDEX idx_farms_user_id ON farms(user_id);
CREATE INDEX idx_farms_status ON farms(status);

-- 종자 등록
CREATE INDEX idx_seed_reg_farm_id ON seed_registrations(farm_id);
CREATE INDEX idx_seed_reg_crop_id ON seed_registrations(crop_id);



-- 수급 데이터 (핵심 조회)
CREATE UNIQUE INDEX idx_balance_data_unique ON balance_data(region_code, crop_id, year, season);
CREATE INDEX idx_balance_data_status ON balance_data(balance_status);

-- 상품
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_status ON products(status);

-- 주문
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(status);

-- 게시글
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_category ON posts(category);

-- 알림 (빈번한 조회)
CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, is_read);

```
