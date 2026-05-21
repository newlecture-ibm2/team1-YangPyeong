import type { FarmDetail } from '../../_lib/farm.types';

/** PATCH 시 PNU·법정동 필드 유지용 */
export function buildFarmAddressPayload(detail: FarmDetail) {
  const pnu = detail.pnuCode;
  let bjdCode = detail.bjdCode;
  let isMountain = false;
  let mainNo: string | undefined;
  let subNo: string | undefined;

  if (pnu && pnu.length === 19) {
    bjdCode = bjdCode && bjdCode.length === 10 ? bjdCode : pnu.substring(0, 10);
    isMountain = pnu.charAt(10) === '2';
    mainNo = String(parseInt(pnu.substring(11, 15), 10));
    subNo = String(parseInt(pnu.substring(15, 19), 10));
  }

  return {
    name: detail.name,
    address: detail.address,
    area: detail.area,
    cropIds: detail.cropIds ?? [],
    bjdCode: bjdCode && bjdCode.length === 10 ? bjdCode : undefined,
    isMountain,
    mainNo,
    subNo,
  };
}
