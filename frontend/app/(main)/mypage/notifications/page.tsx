import Card from '@/components/common/Card/Card';

/**
 * 마이페이지 — 알림
 * TODO: 다른 팀원이 구현 예정 (수급 알림, 주문 알림, 커뮤니티 알림 등)
 */
export default function MypageNotificationsPage() {
  return (
    <Card>
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</p>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>알림</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          수급 알림, 주문 알림, 커뮤니티 알림을 확인할 수 있습니다.
        </p>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '24px' }}>
          🚧 구현 예정입니다.
        </p>
      </div>
    </Card>
  );
}
