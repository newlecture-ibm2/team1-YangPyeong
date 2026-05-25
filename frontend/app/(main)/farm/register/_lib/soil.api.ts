/**
 * 토양 정보 통합 조회를 위한 API 호출 함수
 */

export interface SoilAnalysisResult {
  pnuCd: string;
  // 물리성
  soilTexture: string;
  drainage: string;
  soilDepth: string;
  // 화학성
  ph: string;
  organicMatter: string;
  // Fallback 정보
  isBjdAverage: boolean;
  // 원본 데이터
  physicalRaw: any;
  chemicalRaw: any;
}

/**
 * PNU 코드를 사용하여 통합 토양 정보(물리+화학)를 조회합니다.
 */
export const fetchSoilAnalysis = async (pnu: string): Promise<SoilAnalysisResult | null> => {
  try {
    const response = await fetch(`/api/soil/${pnu}`);
    const data = await response.json();

    if (!data.success) {
      return null;
    }

    const physical = data.physical;
    const chemical = data.chemical;
    
    return {
      pnuCd: pnu,
      soilTexture: physical?.surttureCd || physical?.Surtture_Cd || physical?.SURTTURE_CD || '',
      drainage: physical?.soildraCd || physical?.Soildra_Cd || physical?.SOILDRA_CD || '',
      soilDepth: physical?.vldsoildepCd || physical?.Vldsoildep_Cd || physical?.VLDSOILDEP_CD || '',
      ph: chemical?.acid || '',
      organicMatter: chemical?.om || '',
      isBjdAverage: data.isBjdAverage || false,
      physicalRaw: physical,
      chemicalRaw: chemical
    };
  } catch (error) {
    console.error('[SoilAPI] 통합 분석 실패:', error);
    return null;
  }
};
