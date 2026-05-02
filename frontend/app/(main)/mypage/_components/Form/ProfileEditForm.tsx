'use client';

import { ProfileUpdateRequest } from '../../_lib/profile.types';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input/Input';
import styles from './Form.module.css';

interface ProfileEditFormProps {
  formData: ProfileUpdateRequest;
  isSaving: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  error?: string | null;
}

export default function ProfileEditForm({
  formData,
  isSaving,
  onChange,
  onSave,
  onCancel,
  error
}: ProfileEditFormProps) {
  const bioLength = formData.bio?.length || 0;

  return (
    <div className={styles.editForm}>
      {error && <div className={styles.errorMsg}>{error}</div>}
      
      <div className={styles.formGrid}>
        <Input
          label="이름/닉네임"
          name="name"
          value={formData.name}
          onChange={onChange}
          placeholder="닉네임을 입력하세요"
          required
        />
        <Input
          label="연락처"
          name="phone"
          value={formData.phone}
          onChange={onChange}
          placeholder="010-0000-0000"
        />
        <Input
          label="활동 지역"
          name="region"
          value={formData.region}
          onChange={onChange}
          placeholder="예: 양평군 강상면"
        />
        <Input
          label="주소"
          name="address"
          value={formData.address}
          onChange={onChange}
          placeholder="상세 주소를 입력하세요"
        />
        
        <div className={styles.textareaWrapper}>
          <label className={styles.textareaLabel}>자기소개</label>
          <textarea
            name="bio"
            className={styles.textarea}
            value={formData.bio}
            onChange={onChange}
            placeholder="회원님을 소개해주세요 (관심 작물, 영농 경력 등)"
            maxLength={1000}
          />
          <div className={styles.charCount}>
            <span className={bioLength > 950 ? styles.countWarning : ''}>
              {bioLength}
            </span> / 1000
          </div>
        </div>
      </div>

      <div className={styles.formActions}>
        <Button variant="outline" size="lg" onClick={onCancel} disabled={isSaving}>
          취소
        </Button>
        <Button variant="primary" size="lg" onClick={onSave} disabled={isSaving}>
          저장하기
        </Button>
      </div>
    </div>
  );
}
