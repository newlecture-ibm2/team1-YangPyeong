'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import AuthBrand from '../../_components/AuthBrand/AuthBrand';
import styles from '../page.module.css';

/** 비밀번호 재설정 성공 화면 */
export default function ResetSuccess() {
  const router = useRouter();

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <AuthBrand />
        <h1 className={styles.authTitle}>재설정 완료! 🔐</h1>
        <div className={styles.successMsg}>
          비밀번호가 성공적으로 변경되었습니다.<br />
          새 비밀번호로 로그인해주세요.
        </div>
        <Button id="reset-go-login" variant="dark" size="lg" fullWidth onClick={() => router.push('/login')}>
          로그인하러 가기
        </Button>
      </div>
    </div>
  );
}
