/* ════════════════════════════════════════════════════════
   Farm 도메인 타입 정의
   ════════════════════════════════════════════════════════ */

export type CertificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** 농장 기본 정보 */
export interface Farm {
  id: number;
  name: string;
  address: string;
  area: number;
  cropTypes: string[];
  bjdCode?: string;
  pnuCode?: string;
  latitude?: number;
  longitude?: number;
  registrationNumber?: string;
  documentUrl?: string;
  certificationStatus: CertificationStatus;
  createdAt?: string;
  updatedAt?: string;
}

/** 농장 목록 조회의 개별 항목 (요약 정보) */
export interface FarmListItem {
  id: number;
  name: string;
  address: string;
  area: number;
  cropTypes: string[];
  certificationStatus: CertificationStatus;
}

/** 농장 상세 정보 응답 */
export interface FarmDetail extends Farm {
  // 상세 조회 시 추가될 필드가 있다면 여기에 정의
}

/** 농장 등록 요청 페이로드 */
export interface FarmRegisterPayload {
  name: string;
  address: string;
  area: number;
  cropTypes: string[];
  bjdCode: string;
  isMountain: boolean;
  mainNo: string;
  subNo: string;
  registrationNumber?: string;
  documentUrl?: string;
}

/** 농장 수정 요청 페이로드 */
export interface FarmUpdatePayload {
  name?: string;
  address?: string;
  area?: number;
  cropTypes?: string[];
  bjdCode?: string;
  isMountain?: boolean;
  mainNo?: string;
  subNo?: string;
  registrationNumber?: string;
  documentUrl?: string;
}
