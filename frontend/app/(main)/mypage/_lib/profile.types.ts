/** 사용자 역할 */
export type UserRole = 'USER' | 'FARMER' | 'ADMIN' | 'GOV';

/** 역할 라벨 매핑 */
export const ROLE_LABEL_MAP: Record<UserRole, string> = {
  USER: '일반 회원',
  FARMER: '농업인',
  ADMIN: '관리자',
  GOV: '지자체 담당자',
};

/** 사용자 프로필 */
export interface UserProfile {
  email: string;
  name: string;
  phone: string;
  region: string;
  address: string | null;
  bio: string | null;
  role: UserRole;
  profileImageUrl: string | null;
}

/** 프로필 수정 요청 */
export interface ProfileUpdateRequest {
  name: string;
  phone: string;
  region: string;
  address: string;
  bio: string;
}
