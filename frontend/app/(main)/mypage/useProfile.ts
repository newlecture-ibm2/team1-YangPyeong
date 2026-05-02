'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { UserProfile, ProfileUpdateRequest } from './_lib/profile.types';

// 쿠키에서 유저 정보 가져오기 (초기 로딩용)
const getUserFromCookie = (): Partial<UserProfile> | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )fb-user=([^;]+)'));
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[2]));
    } catch {
      return null;
    }
  }
  return null;
};

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileUpdateRequest | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // 초기 데이터 로드
  useEffect(() => {
    const cookieUser = getUserFromCookie();
    if (cookieUser && cookieUser.email) {
      const initialProfile: UserProfile = {
        email: cookieUser.email,
        name: cookieUser.name || '사용자',
        phone: cookieUser.phone || '',
        region: cookieUser.region || '',
        address: cookieUser.address || '',
        bio: cookieUser.bio || '',
        role: (cookieUser.role as UserProfile['role']) || 'USER',
        profileImageUrl: cookieUser.profileImageUrl || null,
      };
      setProfile(initialProfile);
      setFormData({
        name: initialProfile.name,
        phone: initialProfile.phone,
        region: initialProfile.region,
        address: initialProfile.address || '',
        bio: initialProfile.bio || '',
      });
    }
    setLoading(false);
  }, []);

  /** 입력 변경 핸들러 */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : prev));
  }, []);

  /** 수정 모드 진입 */
  const startEditing = useCallback(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        phone: profile.phone,
        region: profile.region,
        address: profile.address || '',
        bio: profile.bio || '',
      });
    }
    setIsEditing(true);
  }, [profile]);

  /** 수정 취소 */
  const cancelEditing = useCallback(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        phone: profile.phone,
        region: profile.region,
        address: profile.address || '',
        bio: profile.bio || '',
      });
    }
    setIsEditing(false);
  }, [profile]);

  /** 프로필 저장 */
  const saveProfile = useCallback(async () => {
    if (!formData || !profile) return false;
    setIsSaving(true);
    try {
      const res = await apiFetch<void>('/api/users/me', {
        method: 'PUT',
        body: formData,
      });

      if (res.success) {
        const updatedProfile = { ...profile, ...formData };
        setProfile(updatedProfile);
        
        // 브라우저 쿠키(fb-user) 동기화
        if (typeof document !== 'undefined') {
          const expiration = new Date();
          expiration.setDate(expiration.getDate() + 7); // 7일 유지
          document.cookie = `fb-user=${encodeURIComponent(JSON.stringify(updatedProfile))}; path=/; expires=${expiration.toUTCString()}`;
        }

        setIsEditing(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Profile update error', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [formData, profile]);

  /** 닉네임 중복 확인 */
  const checkNickname = useCallback(async (name: string) => {
    if (!name || name.trim().length < 2) return false;
    try {
      const res = await apiFetch<boolean>(`/api/users/check-nickname?name=${encodeURIComponent(name)}`);
      return res.success && res.data === true;
    } catch {
      return false;
    }
  }, []);

  /** 프로필 이미지 업로드 */
  const uploadImage = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const previewUrl = URL.createObjectURL(file);
      
      setProfile((prev) => {
        const next = prev ? { ...prev, profileImageUrl: previewUrl } : prev;
        if (next && typeof document !== 'undefined') {
          document.cookie = `fb-user=${encodeURIComponent(JSON.stringify(next))}; path=/`;
        }
        return next;
      });
      
      return true;
    } catch (error) {
      console.error('Image upload failed', error);
      return false;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
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
    checkNickname,
    uploadImage,
  };
}
