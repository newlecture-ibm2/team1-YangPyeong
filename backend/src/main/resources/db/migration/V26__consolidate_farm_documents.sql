-- V28__consolidate_farm_documents.sql

-- 1. 새 JSONB 컬럼 추가
ALTER TABLE farms ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]';
ALTER TABLE farms ADD COLUMN IF NOT EXISTS document_data JSONB;

-- 2. 기존 데이터 이관 (land_cert_image_url → documents JSONB)
UPDATE farms SET documents = (
  COALESCE(
    (SELECT jsonb_agg(doc) FROM (
      SELECT jsonb_build_object('type', 'LAND_CERT', 'url', land_cert_image_url, 'name', 'land_cert') AS doc
      WHERE land_cert_image_url IS NOT NULL
    ) sub),
    '[]'::jsonb
  )
);

-- 3. 레거시 컬럼 삭제
ALTER TABLE farms DROP COLUMN IF EXISTS land_cert_image_url;
ALTER TABLE farms DROP COLUMN IF EXISTS registration_number;
ALTER TABLE farms DROP COLUMN IF EXISTS business_number;
ALTER TABLE farms DROP COLUMN IF EXISTS land_cert_verified;
