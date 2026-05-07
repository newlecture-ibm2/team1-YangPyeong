-- V20: cultivation_registrations 테이블의 컬럼 타입 수정
-- DECIMAL(NUMERIC) → DOUBLE PRECISION 으로 변경하여 JPA Entity(Double)와 타입 일치시킴
-- Hibernate schema-validation 모드에서 타입 불일치 오류 해결

ALTER TABLE cultivation_registrations
    ALTER COLUMN cultivation_area TYPE DOUBLE PRECISION;

ALTER TABLE cultivation_registrations
    ALTER COLUMN farmer_estimated_yield TYPE DOUBLE PRECISION;
