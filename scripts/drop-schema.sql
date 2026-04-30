-- =============================================
-- FarmBalance DROP Schema
-- ERD 기반 25개 테이블 전체 삭제
-- 생성일: 2026-04-27
-- =============================================

-- FK 의존성 역순으로 삭제

-- 외부 API 독립 테이블
DROP TABLE IF EXISTS pest_occurrence_reports CASCADE;
DROP TABLE IF EXISTS crop_guides CASCADE;
DROP TABLE IF EXISTS soil_fitness_data CASCADE;
DROP TABLE IF EXISTS crop_production_stats CASCADE;
DROP TABLE IF EXISTS soil_exam_data CASCADE;
DROP TABLE IF EXISTS weather_data CASCADE;

-- RAG 도메인
DROP TABLE IF EXISTS rag_documents CASCADE;
DROP TABLE IF EXISTS rag_categories CASCADE;

-- 알림 도메인
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS guide_messages CASCADE;

-- 정책 도메인
DROP TABLE IF EXISTS policy_data CASCADE;

-- 커뮤니티 도메인
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS post_categories CASCADE;

-- 상점 도메인
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS uploads CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;

-- 수급 도메인
DROP TABLE IF EXISTS balance_data CASCADE;

-- 작물/농장 도메인
DROP TABLE IF EXISTS seed_registrations CASCADE;
DROP TABLE IF EXISTS crops CASCADE;
DROP TABLE IF EXISTS crop_categories CASCADE;
DROP TABLE IF EXISTS farms CASCADE;

-- 유저 도메인
DROP TABLE IF EXISTS users CASCADE;
