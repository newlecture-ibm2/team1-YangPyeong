'use client';

import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import styles from './page.module.css';

export default function LoginPage() {
  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.logoArea}>
          <Image src="/logo.png" alt="FarmBalance 로고" width={60} height={60} />
          <span>Farm<em>Balance</em></span>
        </div>

        <h2 className={styles.authTitle}>로그인</h2>
        <p className={styles.authSub}>양평군 스마트 파밍 플랫폼에 오신 것을 환영합니다</p>

        <Input label="이메일" type="email" placeholder="farmer@yangpyeong.kr" />
        <Input label="비밀번호" type="password" placeholder="비밀번호 입력" />

        <Button variant="primary" size="lg" fullWidth>
          로그인
        </Button>

        <div className={styles.authDivider}>또는</div>

        <Button variant="kakao" size="lg" fullWidth>
          🟡 카카오로 시작하기
        </Button>

        <p className={styles.authFooter}>
          계정이 없으신가요? <Link href="/signup">회원가입 →</Link>
        </p>
      </div>
    </div>
  );
}
