'use client';

import Link from 'next/link';
import { UserProfile, PROVIDER_LABEL_MAP, ROLE_LABEL_MAP } from '../../_lib/profile.types';
import Button from '@/components/common/Button';
import styles from './Info.module.css';

interface ProfileInfoViewProps {
  profile: UserProfile;
  onEdit: () => void;
}

/** 날짜 포맷 (2026-04-27T... → 2026년 4월 27일) */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function ProfileInfoView({ profile, onEdit }: ProfileInfoViewProps) {
  const isFarmer = profile.role === 'FARMER';

  return (
    <div className={styles.infoGrid}>
      {/* 계정 정보 섹션 */}
      <div className={`${styles.infoItem} ${styles.fullWidth}`}>
        <div className={styles.sectionLabel}>계정 정보</div>
      </div>

      <div className={styles.infoItem}>
        <label>이메일</label>
        <p>{profile.email}</p>
      </div>
      <div className={styles.infoItem}>
        <label>회원 유형</label>
        <p>
          <span className={styles.roleBadgeInline}>{ROLE_LABEL_MAP[profile.role]}</span>
        </p>
      </div>
      <div className={styles.infoItem}>
        <label>로그인 방식</label>
        <p className={styles.providerInfo}>
          {profile.provider === 'KAKAO' && (
            <span className={`${styles.providerIcon} ${styles.kakao}`}>K</span>
          )}
          {profile.provider === 'GOOGLE' && (
            <span className={`${styles.providerIcon} ${styles.google}`}>G</span>
          )}
          {profile.provider === 'LOCAL' && (
            <span className={`${styles.providerIcon} ${styles.local}`}>✉</span>
          )}
          {PROVIDER_LABEL_MAP[profile.provider]}
        </p>
      </div>
      <div className={styles.infoItem}>
        <label>가입일</label>
        <p>{formatDate(profile.createdAt)}</p>
      </div>

      {/* 연락처 섹션 */}
      <div className={`${styles.infoItem} ${styles.fullWidth}`}>
        <div className={styles.sectionLabel}>연락처 정보</div>
      </div>

      <div className={styles.infoItem}>
        <label>연락처</label>
        <p>{profile.phone || '등록된 번호가 없습니다.'}</p>
      </div>
      <div className={styles.infoItem}>
        <label>주소</label>
        <p>{profile.address || '등록된 주소가 없습니다.'}</p>
      </div>

      {/* 자기소개 */}
      <div className={`${styles.infoItem} ${styles.fullWidth}`}>
        <label>자기소개</label>
        <p className={styles.bioText}>{profile.bio || '나를 소개하는 글을 작성해보세요.'}</p>
      </div>

      {/* 내 농장 링크 (FARMER만 표시) */}
      {isFarmer && (
        <div className={`${styles.infoItem} ${styles.fullWidth}`}>
          <Link href="/farm" className={styles.farmLink}>
            <span className={styles.farmLinkIcon}>🌾</span>
            <span className={styles.farmLinkText}>내 농장 관리</span>
            <span className={styles.farmLinkArrow}>→</span>
          </Link>
        </div>
      )}
      
      <div className={styles.actions}>
        <Button variant="dark" size="lg" onClick={onEdit}>
          프로필 수정하기
        </Button>
      </div>
    </div>
  );
}
