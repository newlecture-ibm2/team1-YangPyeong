/* ── 관리자 유저 관리 타입 정의 ── */

export interface AdminUser {
  id: number
  email: string
  name: string
  phone: string | null
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
}

export type UserRole = 'USER' | 'FARMER' | 'ADMIN' | 'GOV'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'WITHDRAWN'

/** 역할 변경 허용 값 (GOV 제외) */
export type ChangeableRole = 'USER' | 'FARMER'

export interface ChangeRoleRequest {
  role: ChangeableRole
}

export interface ChangeStatusRequest {
  status: UserStatus
}

export interface CreateUserRequest {
  email: string
  password: string
  name: string
  role: 'ADMIN' | 'GOV'
}

export interface UserListResponse {
  users: AdminUser[]
  meta: {
    page: number
    size: number
    totalCount: number
    totalPages: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error: {
    code: string
    message: string
  } | null
}

/** 역할 한글 매핑 */
export const ROLE_LABELS: Record<UserRole, string> = {
  USER: '일반',
  FARMER: '농부',
  ADMIN: '관리자',
  GOV: '지자체',
}

/** 상태 한글 매핑 */
export const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: '활성',
  SUSPENDED: '정지',
  PENDING: '대기',
  WITHDRAWN: '탈퇴',
}
