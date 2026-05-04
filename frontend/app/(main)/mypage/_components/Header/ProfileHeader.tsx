'use client';

import { useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import styles from './Header.module.css';

interface ProfileImageUploadProps {
  currentImageUrl: string | null;
  onUpload: (file: File) => Promise<boolean>;
  disabled?: boolean;
}

export default function ProfileImageUpload({
  currentImageUrl,
  onUpload,
  disabled = false,
}: ProfileImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      await onUpload(file);
    }
  };

  return (
    <div className={styles.imageContainer}>
      <div 
        className={`${styles.imageWrapper} ${disabled ? styles.disabled : ''}`} 
        onClick={handleClick}
      >
        {currentImageUrl ? (
          <Image src={currentImageUrl} alt="프로필" fill className={styles.image} priority />
        ) : (
          <div className={styles.placeholder}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        )}
        {!disabled && (
          <div className={styles.overlay}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        )}
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
    </div>
  );
}

import { UserProfile, ROLE_LABEL_MAP, PROVIDER_LABEL_MAP } from '../../_lib/profile.types';

interface ProfileHeaderProps {
  profile: UserProfile;
  isUploading: boolean;
  onImageUpload: (file: File) => Promise<boolean>;
}

export function ProfileHeader({ profile, isUploading, onImageUpload }: ProfileHeaderProps) {
  return (
    <div className={styles.header}>
      <ProfileImageUpload
        currentImageUrl={profile.profileImageUrl}
        onUpload={onImageUpload}
        disabled={isUploading}
      />
      <div className={styles.headerInfo}>
        <div className={styles.nameRow}>
          <h1 className={styles.profileName}>{profile.name}</h1>
          <span className={styles.roleBadge}>{ROLE_LABEL_MAP[profile.role]}</span>
        </div>
        <p className={styles.profileEmail}>{profile.email}</p>
        <div className={styles.metaRow}>
          <span className={styles.metaItem}>
            {profile.provider === 'KAKAO' && '🟡 '}
            {profile.provider === 'GOOGLE' && '🔵 '}
            {profile.provider === 'LOCAL' && '✉️ '}
            {PROVIDER_LABEL_MAP[profile.provider]}
          </span>
          {profile.createdAt && (
            <span className={styles.metaItem}>
              📅 {new Date(profile.createdAt).getFullYear()}년 {new Date(profile.createdAt).getMonth() + 1}월 가입
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
