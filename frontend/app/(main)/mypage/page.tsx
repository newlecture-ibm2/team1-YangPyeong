import Card from '@/components/common/Card/Card';

/**
 * 마이페이지 — 프로필 관리
 * TODO: 다른 팀원이 구현 예정 (프로필 수정, 비밀번호 변경, 농장 정보 연동)
 */
export default function MypageProfilePage() {
  return (
    <Card>
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>👤</p>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>프로필 관리</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          프로필 수정, 비밀번호 변경, 농장 정보를 관리할 수 있습니다.
        </p>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '24px' }}>
          🚧 구현 예정입니다.
        </p>
      </div>
    </Card>
  );
}
