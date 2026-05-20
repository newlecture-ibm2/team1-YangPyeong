-- ════════════════════════════════════════════════════════
-- V35: products 테이블에 unit_kg 컬럼 추가
--
-- 판매 단위(kg). 예) unit_kg=5 → "5kg 단위로 판매"
-- price는 unit_kg 1개당 가격, stock은 unit_kg 단위의 재고 수.
-- 기존 데이터는 1kg 단위로 간주하여 기본값 1을 적용.
-- ════════════════════════════════════════════════════════

ALTER TABLE products
    ADD COLUMN unit_kg INT NOT NULL DEFAULT 1;

-- 데이터 무결성 보장: 양수만 허용
ALTER TABLE products
    ADD CONSTRAINT chk_products_unit_kg_positive CHECK (unit_kg >= 1);
