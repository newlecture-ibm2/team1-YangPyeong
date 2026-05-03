'use client';

import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import type useLogin from '../useLogin';
import styles from '../page.module.css';

interface LoginFormProps {
  hook: ReturnType<typeof useLogin>;
}

export default function LoginForm({ hook }: LoginFormProps) {
  return (
    <form className={styles.form} onSubmit={hook.handleSubmit}>
      <Input
        label="이메일" id="login-email" type="email"
        placeholder="example@farmbalance.kr"
        value={hook.email} onChange={(e) => hook.setEmail(e.target.value)}
        required autoComplete="email"
      />
      <Input
        label="비밀번호" id="login-password" type="password"
        placeholder="비밀번호를 입력해주세요"
        value={hook.password} onChange={(e) => hook.setPassword(e.target.value)}
        required autoComplete="current-password"
      />
      <Button type="submit" variant="dark" size="lg" fullWidth disabled={hook.loading}>
        {hook.loading ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
}
