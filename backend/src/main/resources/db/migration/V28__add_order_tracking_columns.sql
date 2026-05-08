-- V28: 주문 테이블에 더미 택배 추적 컬럼 추가
-- tracking_number: 발송 시 자동 생성되는 송장번호
-- shipped_at: 발송 시각 (배송중 전환 시점, 자동완료 계산 기준)

ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(30);
ALTER TABLE orders ADD COLUMN shipped_at TIMESTAMP;
