-- ============================================================
-- FarmBalance — PostgreSQL 스키마 초기화 (DROP ALL)
-- 모든 테이블을 의존 관계 역순으로 삭제합니다.
-- ⚠️ 주의: 모든 데이터가 삭제됩니다. 운영 환경에서는 사용 금지!
-- ============================================================

DROP TABLE IF EXISTS notifications    CASCADE;
DROP TABLE IF EXISTS guide_messages   CASCADE;
DROP TABLE IF EXISTS policy_data      CASCADE;
DROP TABLE IF EXISTS comments         CASCADE;
DROP TABLE IF EXISTS posts            CASCADE;
DROP TABLE IF EXISTS cart_items       CASCADE;
DROP TABLE IF EXISTS order_items      CASCADE;
DROP TABLE IF EXISTS orders           CASCADE;
DROP TABLE IF EXISTS products         CASCADE;
DROP TABLE IF EXISTS balance_data     CASCADE;

DROP TABLE IF EXISTS seed_registrations CASCADE;
DROP TABLE IF EXISTS crops            CASCADE;
DROP TABLE IF EXISTS farms            CASCADE;
DROP TABLE IF EXISTS users            CASCADE;

-- ============================================================
-- 완료 — 모든 테이블이 삭제되었습니다.
-- ============================================================
