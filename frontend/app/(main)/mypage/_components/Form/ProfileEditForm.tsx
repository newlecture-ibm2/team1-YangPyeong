'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ProfileUpdateRequest } from '../../_lib/profile.types';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input/Input';
import Modal from '@/components/common/Modal/Modal';
import { formatPhone, validatePhoneOptional } from '@/lib/phone';
import styles from './Form.module.css';

// 다음 우편번호 검색 (SSR 방지)
const DaumPostcodeEmbed = dynamic(() => import('react-daum-postcode'), { ssr: false });

/** 필드별 유효성 검사 에러 */
interface FormErrors {
  name?: string;
  phone?: string;
  region?: string;
  address?: string;
}

/** 활동 지역 유효성 검사 (빈 값 허용, 입력 시 최소 2자) */
function validateRegion(value: string): string | undefined {
  if (!value.trim()) return undefined;
  if (value.trim().length < 2) {
    return '활동 지역은 최소 2자 이상 입력해주세요.';
  }
  if (value.trim().length > 50) {
    return '활동 지역은 50자 이내로 입력해주세요.';
  }
  return undefined;
}

interface ProfileEditFormProps {
  formData: ProfileUpdateRequest;
  isSaving: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSave: (overrides?: Partial<ProfileUpdateRequest>) => Promise<void>;
  onCancel: () => void;
  onCheckNickname?: (name: string) => Promise<boolean>;
  error?: string | null;

}

export default function ProfileEditForm({
  formData,
  isSaving,
  onChange,
  onSave,
  onCancel,
  onCheckNickname,
  error
}: ProfileEditFormProps) {
  const bioLength = formData.bio?.length || 0;
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // 기본주소 / 상세주소 분리 관리
  const [baseAddress, setBaseAddress] = useState(() => {
    // 기존 address에서 ' , ' 기준으로 분리 (이전에 합쳐서 저장된 경우)
    const parts = (formData.address || '').split(' , ');
    return parts[0] || '';
  });
  const [detailAddress, setDetailAddress] = useState(() => {
    const parts = (formData.address || '').split(' , ');
    return parts[1] || '';
  });
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);

  /** 개별 필드 blur 시 유효성 검사 */
  const handleBlur = useCallback(async (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    if (fieldName === 'name' && onCheckNickname && formData.name.trim().length >= 2) {
      const isAvailable = await onCheckNickname(formData.name);
      setNicknameChecked(true);
      setErrors(prev => ({
        ...prev,
        name: isAvailable ? undefined : '이미 사용 중인 이름입니다.',
      }));
      return;
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      switch (fieldName) {
        case 'name':
          newErrors.name = formData.name.trim().length < 2 ? '이름은 2자 이상 입력해주세요.' : undefined;
          break;
        case 'phone':
          newErrors.phone = validatePhoneOptional(formData.phone);
          break;
        case 'region':
          newErrors.region = validateRegion(formData.region);
          break;
      }
      return newErrors;
    });
  }, [formData, onCheckNickname]);

  /** 전화번호 입력 시 자동 포맷 + onChange 호출 */
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const formatted = formatPhone((e.target as HTMLInputElement).value);
    const syntheticEvent = {
      ...e,
      target: { ...e.target, name: 'phone', value: formatted },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);

    if (touched.phone) {
      setErrors(prev => ({ ...prev, phone: validatePhoneOptional(formatted) }));
    }
  }, [onChange, touched.phone]);

  /** 다음 우편번호 검색 완료 핸들러 */
  const handlePostcodeComplete = useCallback((data: { address: string; roadAddress: string; jibunAddress: string; zonecode: string }) => {
    const selectedAddress = data.roadAddress || data.jibunAddress || data.address;
    setBaseAddress(selectedAddress);
    setDetailAddress(''); // 새 주소 검색 시 상세주소 초기화

    // 기본주소만 우선 세팅 (저장 시 상세주소와 합침)
    const syntheticEvent = {
      target: { name: 'address', value: selectedAddress },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);

    setErrors(prev => ({ ...prev, address: undefined }));
    setTouched(prev => ({ ...prev, address: true }));
    setIsPostcodeOpen(false);
  }, [onChange]);

  /** 저장 시 전체 유효성 검사 + 닉네임 중복 검사 + 주소 합치기 */
  const handleSave = useCallback(async () => {
    const nameErr = formData.name.trim().length < 2 ? '이름은 2자 이상 입력해주세요.' : undefined;
    const phoneErr = validatePhoneOptional(formData.phone);
    const regionErr = validateRegion(formData.region);

    // 닉네임 중복 검사 (아직 체크하지 않은 경우)
    let nicknameErr: string | undefined;
    if (!nameErr && onCheckNickname) {
      const isAvailable = await onCheckNickname(formData.name);
      if (!isAvailable) nicknameErr = '이미 사용 중인 이름입니다.';
    }

    const newErrors: FormErrors = {
      name: nameErr || nicknameErr,
      phone: phoneErr,
      region: regionErr,
    };

    setErrors(newErrors);
    setTouched({ name: true, phone: true, region: true, address: true });

    if (newErrors.name || phoneErr || regionErr) return;

    // 기본주소 + 상세주소 합쳐서 overrides로 직접 전달
    const fullAddress = detailAddress.trim()
      ? `${baseAddress} , ${detailAddress.trim()}`
      : baseAddress;

    await onSave({ address: fullAddress });
  }, [formData, onSave, onCheckNickname, baseAddress, detailAddress]);

  const hasErrors = !!(errors.name || errors.phone || errors.region);

  return (
    <div className={styles.editForm}>
      {error && <div className={styles.errorMsg}>{error}</div>}
      
      <div className={styles.formGrid}>
        <div className={styles.fieldWrapper}>
          <Input
            label="이름/닉네임"
            name="name"
            value={formData.name}
            onChange={(e) => { onChange(e); setNicknameChecked(false); setErrors(prev => ({ ...prev, name: undefined })); }}
            onBlur={() => handleBlur('name')}
            placeholder="닉네임을 입력하세요"
            required
          />
          {touched.name && errors.name && (
            <span className={styles.fieldError}>{errors.name}</span>
          )}
          {nicknameChecked && !errors.name && formData.name.trim().length >= 2 && (
            <span className={styles.fieldSuccess}>✓ 사용 가능한 이름입니다.</span>
          )}
        </div>

        {/* 연락처 (자동포맷 + 유효성 검사) */}
        <div className={styles.fieldWrapper}>
          <Input
            label="연락처"
            name="phone"
            value={formData.phone}
            onChange={handlePhoneChange}
            onBlur={() => handleBlur('phone')}
            placeholder="010-0000-0000"
          />
          {touched.phone && errors.phone && (
            <span className={styles.fieldError}>{errors.phone}</span>
          )}
        </div>

        {/* 활동 지역 */}
        <div className={styles.fieldWrapper}>
          <Input
            label="활동 지역"
            name="region"
            value={formData.region}
            onChange={(e) => {
              onChange(e);
              if (touched.region) {
                setErrors(prev => ({ ...prev, region: validateRegion(e.target.value) }));
              }
            }}
            onBlur={() => handleBlur('region')}
            placeholder="예: 양평군 강상면"
          />
          {touched.region && errors.region && (
            <span className={styles.fieldError}>{errors.region}</span>
          )}
        </div>

        {/* 주소 (다음 우편번호 검색) */}
        <div className={`${styles.fieldWrapper} ${styles.addressField}`}>
          <label className={styles.addressLabel}>주소</label>
          <div className={styles.addressRow}>
            <input
              type="text"
              className={styles.addressInput}
              value={baseAddress}
              readOnly
              placeholder="주소 검색 버튼을 클릭하세요"
              onClick={() => setIsPostcodeOpen(true)}
            />
            <button
              type="button"
              className={styles.addressSearchBtn}
              onClick={() => setIsPostcodeOpen(true)}
            >
              🔍 주소 검색
            </button>
          </div>
          {baseAddress && (
            <>
              <span className={styles.addressSelected}>✓ {baseAddress}</span>
              <input
                type="text"
                className={styles.detailAddressInput}
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                placeholder="상세 주소를 입력하세요 (동, 호수 등)"
              />
            </>
          )}
        </div>
        
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
        <Button variant="primary" size="lg" onClick={handleSave} disabled={isSaving || hasErrors}>
          저장하기
        </Button>
      </div>

      {/* 다음 우편번호 검색 모달 */}
      <Modal
        isOpen={isPostcodeOpen}
        onClose={() => setIsPostcodeOpen(false)}
        title="주소 검색"
      >
        <div className={styles.postcodeWrapper}>
          <DaumPostcodeEmbed
            onComplete={handlePostcodeComplete}
            style={{ width: '100%', height: '460px' }}
          />
        </div>
      </Modal>
    </div>
  );
}
