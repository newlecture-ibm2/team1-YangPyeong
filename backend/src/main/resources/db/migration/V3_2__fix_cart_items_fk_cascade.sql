-- ═══════════════════════════════════════════════════════════════
-- V3.2: cart_items.product_id FK에 ON DELETE CASCADE 추가
-- 상품 삭제 시 장바구니 항목도 자동 정리되도록 수정
-- (V4 시드 데이터의 products DELETE 시 FK 위반 방지)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE cart_items
    DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;

ALTER TABLE cart_items
    ADD CONSTRAINT cart_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
