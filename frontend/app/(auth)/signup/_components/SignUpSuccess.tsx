'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import AuthBrand from '../../_components/AuthBrand/AuthBrand';
import styles from '../page.module.css';

interface SuccessScreenProps {
  title: string;
  message: React.ReactNode;
}

/** 회원가입 성공 / 재활성화 성공 공통 화면 */
export default function SignUpSuccess({ title, message }: SuccessScreenProps) {
  const router = useRouter();

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <AuthBrand />
        <h1 className={styles.authTitle}>{title}</h1>
        <div className={styles.successMsg}>{message}</div>
        <Button variant="dark" size="lg" fullWidth onClick={() => router.push('/login')}>
          로그인하러 가기
        </Button>
      </div>
    </div>
  );
}
