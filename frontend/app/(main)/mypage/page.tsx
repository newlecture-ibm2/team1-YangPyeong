'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/Toast/ToastContext';
import { Spinner } from '@/components';
import Button from '@/components/common/Button/Button';
import { useProfile } from './useProfile';
import { ProfileHeader } from './_components/Header/ProfileHeader';
import ProfileInfoView from './_components/Info/ProfileInfoView';
import ProfileEditForm from './_components/Form/ProfileEditForm';
import { ChangePasswordModal, DeleteAccountModal } from './_components/Account/AccountModals';
import type { ProfileUpdateRequest } from './_lib/profile.types';
import styles from './page.module.css';

/**
 * 마이페이지 프로필 메인 (Deep Colocation Structure)
 */
export default function MyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    profile,
    formData,
    isEditing,
    isSaving,
    isUploading,
    loading,
    profileError,
    handleChange,
    startEditing,
    cancelEditing,
    saveProfile,
    checkNickname,
    uploadImage,
  } = useProfile();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /** 프로필 저장 핸들러 */
  const handleSave = async (overrides?: Partial<ProfileUpdateRequest>) => {
    const success = await saveProfile(overrides);
    if (success) {
      toast('프로필이 성공적으로 수정되었습니다.', 'success');
    } else {
      toast('프로필 수정에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  };

  /** 이미지 업로드 핸들러 */
  const handleImageUpload = async (file: File) => {
    const success = await uploadImage(file);
    if (success) {
      toast('프로필 이미지가 변경되었습니다.', 'success');
    } else {
      toast('이미지 업로드에 실패했습니다.', 'error');
    }
    return success;
  };

  /** 회원 탈퇴 성공 — 토스트 표시 (로그아웃은 DeleteAccountModal에서 자동 처리) */
  const handleDeleteSuccess = () => {
    toast('회원 탈퇴가 완료되었습니다. 30일 이내 재로그인 시 복구할 수 있습니다.', 'success');
  };

  if (loading) {
    return <Spinner message="프로필 정보를 불러오는 중입니다..." fullHeight={true} />;
  }

  if (profileError || !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.contentCard} style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary, #555)' }}>
            프로필 정보를 불러오지 못했습니다. 로그인 상태를 확인한 뒤 다시 시도해 주세요.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button type="button" variant="primary" onClick={() => window.location.reload()}>
              새로고침
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/login')}>
              로그인으로 이동
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 1. 헤더 영역 (Header 폴더 자원 사용) */}
      <ProfileHeader 
        profile={profile} 
        isUploading={isUploading} 
        onImageUpload={handleImageUpload}
        data-guide="mypage-profile"
      />

      <div className={styles.contentCard}>
        {/* 2. 정보 영역 (Info/Form 폴더 자원 사용) */}
        {isEditing && formData ? (
          <ProfileEditForm
            formData={formData}
            isSaving={isSaving}
            onChange={handleChange}
            onSave={handleSave}
            onCancel={cancelEditing}
            onCheckNickname={checkNickname}
          />
        ) : (
          <ProfileInfoView
            profile={profile}
            onEdit={startEditing}
          />
        )}
      </div>

      {/* 3. 계정 설정 영역 */}
      <div className={styles.accountSettings} data-guide="mypage-tabs">
        <h2 className={styles.sectionTitle}>계정 설정</h2>
        <div className={styles.settingsList}>
          {/* LOCAL 유저만 비밀번호 변경 표시 */}
          {profile?.provider === 'LOCAL' && (
            <div className={styles.settingItem}>
              <span>비밀번호 변경</span>
              <button
                className={styles.settingBtn}
                onClick={() => setShowPasswordModal(true)}
              >
                변경
              </button>
            </div>
          )}
          <div className={styles.settingItem}>
            <span className={styles.dangerText}>회원 탈퇴</span>
            <button
              className={`${styles.settingBtn} ${styles.dangerBtn}`}
              onClick={() => setShowDeleteModal(true)}
            >
              탈퇴하기
            </button>
          </div>
        </div>
      </div>

      {/* 모달 */}
      {profile?.provider === 'LOCAL' && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => toast('비밀번호가 성공적으로 변경되었습니다.', 'success')}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDeleteSuccess}
        isSocial={profile?.provider !== 'LOCAL'}
      />
    </div>
  );
}
