-- V35: Add external_id and data_source to crops and crop_categories

-- 1. crop_categories 테이블 변경
ALTER TABLE crop_categories 
ADD COLUMN external_id VARCHAR(50),
ADD COLUMN data_source VARCHAR(20) DEFAULT 'MANUAL';

-- 2. crops 테이블 변경
ALTER TABLE crops 
ADD COLUMN external_id VARCHAR(50),
ADD COLUMN data_source VARCHAR(20) DEFAULT 'MANUAL';

-- 3. 인덱스 추가 (동기화 시 빠른 조회를 위해)
CREATE INDEX idx_crop_categories_external_id ON crop_categories(external_id);
CREATE INDEX idx_crops_external_id ON crops(external_id);
