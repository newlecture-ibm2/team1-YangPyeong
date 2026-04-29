import Card from '@/components/common/Card/Card';

/**
 * 마이페이지 — 주문내역 (구매자)
 * TODO: 다른 팀원이 구현 예정 (구매한 상품 주문 이력, 배송 상태 확인)
 */
export default function MypageHistoryPage() {
  return (
    <Card>
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>📦</p>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>주문내역</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          구매한 상품의 주문 이력과 배송 상태를 확인할 수 있습니다.
        </p>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '24px' }}>
          🚧 구현 예정입니다.
        </p>
      </div>
    </Card>
  );
}
