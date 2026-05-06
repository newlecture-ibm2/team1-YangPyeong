/** 사용자 역할 */
export type UserRole = 'USER' | 'FARMER' | 'ADMIN' | 'GOV';

/** 역할 라벨 매핑 */
export const ROLE_LABEL_MAP: Record<UserRole, string> = {
  USER: '일반 회원',
  FARMER: '농업인',
  ADMIN: '관리자',
  GOV: '지자체 담당자',
};

/** 인증 제공자 */
export type AuthProvider = 'LOCAL' | 'KAKAO' | 'GOOGLE';

/** 제공자 라벨 매핑 */
export const PROVIDER_LABEL_MAP: Record<AuthProvider, string> = {
  LOCAL: '이메일 가입',
  KAKAO: '카카오 로그인',
  GOOGLE: '구글 로그인',
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
  provider: AuthProvider;
  profileImageUrl: string | null;
  createdAt: string | null;
}

/** 프로필 수정 요청 */
export interface ProfileUpdateRequest {
  name: string;
  phone: string;
  region: string;
  address: string;
  bio: string;
}
