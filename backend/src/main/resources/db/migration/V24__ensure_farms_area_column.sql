-- V24: farms.area 컬럼 복구
-- V1에서 area DOUBLE PRECISION NOT NULL로 정의되었으나,
-- 일부 환경에서 컬럼이 누락된 것을 복구합니다.
-- nullable로 변경하여 기존 데이터와의 호환성을 확보합니다.

ALTER TABLE farms ADD COLUMN IF NOT EXISTS area DOUBLE PRECISION;

-- 기존 NOT NULL 제약이 남아있을 경우 제거
ALTER TABLE farms ALTER COLUMN area DROP NOT NULL;
