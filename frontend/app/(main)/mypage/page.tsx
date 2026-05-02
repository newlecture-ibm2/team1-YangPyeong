'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/Toast/ToastContext';
import { apiFetch } from '@/lib/api-fetch';
import { useProfile } from './useProfile';
import { ProfileHeader } from './_components/Header/ProfileHeader';
import ProfileInfoView from './_components/Info/ProfileInfoView';
import ProfileEditForm from './_components/Form/ProfileEditForm';
import { ChangePasswordModal, DeleteAccountModal } from './_components/Account/AccountModals';
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
    handleChange,
    startEditing,
    cancelEditing,
    saveProfile,
    uploadImage,
  } = useProfile();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /** 프로필 저장 핸들러 */
  const handleSave = async () => {
    const success = await saveProfile();
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

  /** 회원 탈퇴 성공 시 로그아웃 처리 */
  const handleDeleteSuccess = async () => {
    toast('회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.', 'success');
    // 로그아웃 처리
    await apiFetch('/api/auth/logout', { method: 'POST' });
    // 쿠키 제거
    if (typeof document !== 'undefined') {
      document.cookie = 'fb-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>프로필 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className={styles.container}>
      {/* 1. 헤더 영역 (Header 폴더 자원 사용) */}
      <ProfileHeader 
        profile={profile} 
        isUploading={isUploading} 
        onImageUpload={handleImageUpload} 
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
          />
        ) : (
          <ProfileInfoView 
            profile={profile} 
            onEdit={startEditing} 
          />
        )}
      </div>

      {/* 3. 계정 설정 영역 */}
      <div className={styles.accountSettings}>
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
        onError={(msg) => toast(msg, 'error')}
        isSocial={profile?.provider !== 'LOCAL'}
      />
    </div>
  );
}
