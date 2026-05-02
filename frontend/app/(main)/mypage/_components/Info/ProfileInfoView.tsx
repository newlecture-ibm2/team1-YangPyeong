'use client';

import { UserProfile } from '../../_lib/profile.types';
import Button from '@/components/common/Button';
import styles from './Info.module.css';

interface ProfileInfoViewProps {
  profile: UserProfile;
  onEdit: () => void;
}

export default function ProfileInfoView({ profile, onEdit }: ProfileInfoViewProps) {
  return (
    <div className={styles.infoGrid}>
      <div className={styles.infoItem}>
        <label>연락처</label>
        <p>{profile.phone || '등록된 번호가 없습니다.'}</p>
      </div>
      <div className={styles.infoItem}>
        <label>활동 지역</label>
        <p>{profile.region || '전국'}</p>
      </div>
      <div className={styles.infoItem}>
        <label>주소</label>
        <p>{profile.address || '등록된 주소가 없습니다.'}</p>
      </div>
      <div className={`${styles.infoItem} ${styles.fullWidth}`}>
        <label>자기소개</label>
        <p className={styles.bioText}>{profile.bio || '나를 소개하는 글을 작성해보세요.'}</p>
      </div>
      
      <div className={styles.actions}>
        <Button variant="dark" size="lg" onClick={onEdit}>
          프로필 수정하기
        </Button>
      </div>
    </div>
  );
}
