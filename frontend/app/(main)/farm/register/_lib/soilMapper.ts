/**
 * 흙토람 토양 코드 매핑 유틸리티
 */

// 토성 (Soil Texture) 매핑
export const getSoilTextureName = (code: string): string => {
  const mapping: Record<string, string> = {
    '01': '사토 (Sand)',
    '02': '사양토 (Sandy Loam)',
    '03': '양토 (Loam)',
    '04': '미사질양토 (Silt Loam)',
    '05': '식양토 (Clay Loam)',
    '06': '식토 (Clay)',
    '07': '미사질식양토',
    '08': '미사토',
    '09': '양질사토',
    '10': '자갈섞인 사양토',
    '11': '자갈섞인 양토',
    '12': '자갈섞인 식양토',
  };
  return mapping[code] || '미분류 (' + code + ')';
};

// 배수등급 (Drainage) 매핑
export const getDrainageName = (code: string): string => {
  const mapping: Record<string, string> = {
    '01': '매우 양호 (Very poorly drained)',
    '02': '약간 불량 (Poorly drained)',
    '03': '양호 (Well drained)',
    '04': '매우 불량 (Somewhat poorly drained)',
    '05': '약간 양호 (Moderately well drained)',
  };
  return mapping[code] || '미분류 (' + code + ')';
};

// 유효토심 (Soil Depth) 매핑
export const getSoilDepthName = (code: string): string => {
  const mapping: Record<string, string> = {
    '01': '매우 얕음 (20cm 미만)',
    '02': '얕음 (20~50cm)',
    '03': '보통 (50~100cm)',
    '04': '깊음 (100cm 이상)',
  };
  return mapping[code] || '미분류 (' + code + ')';
};

/**
 * 주소 정보를 기반으로 19자리 PNU 코드를 생성합니다.
 */
export const generatePnuCode = (
  bjdCode: string,
  isMountain: boolean,
  mainNo: string | undefined | null,
  subNo: string | undefined | null
): string => {
  const registry = isMountain ? '2' : '1';
  
  // 숫자만 추출 (혹시 모를 문자 포함 대비)
  const cleanMain = (mainNo || '0').replace(/[^0-9]/g, '');
  const cleanSub = (subNo || '0').replace(/[^0-9]/g, '');
  
  const paddedMain = cleanMain.padStart(4, '0');
  const paddedSub = cleanSub.padStart(4, '0');
  
  return `${bjdCode}${registry}${paddedMain}${paddedSub}`;
};
