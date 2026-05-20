/* ════════════════════════════════════════════════════════
   재배 가이드 — 상세 전문 가이드북 (작물·농장·경험 맞춤)
   ════════════════════════════════════════════════════════ */

import type { CropRecommendation, CropRecommendResponse } from './recommend.types';
import { buildPestDetailLines } from './pestGuideEntries';
import {
  buildSoilWaterContent,
  buildHarvestContent,
  buildTipsContent,
  resolveGrowerExperience,
} from './cropGuideBuilders';

export interface GuideTopic {
  icon: string;
  title: string;
  content: string[];
}

export interface CropDetailedGuide {
  cropName: string;
  topics: GuideTopic[];
}

export interface CropGuideBuildOptions {
  recommendResult?: CropRecommendResponse | null;
}

/** 서버/AI 응답 → 모달용 가이드 */
export function mapServerGuideToDetailedGuide(dto: {
  crop_name: string;
  topics: GuideTopic[];
}): CropDetailedGuide {
  return {
    cropName: dto.crop_name,
    topics: dto.topics.map((t) => ({
      icon: t.icon || '📌',
      title: t.title,
      content: [...t.content],
    })),
  };
}

/** 카드 병해충과 모달 본문 일치 — AI 병해충 섹션을 정적 상세로 교체 */
export function mergeGuideWithStructuredPests(
  guide: CropDetailedGuide,
  rec: CropRecommendation,
): CropDetailedGuide {
  const pests = rec.pests ?? [];
  if (pests.length === 0) {
    return guide;
  }
  const pestContent = buildPestTopicFromCard(pests, rec.cropName);
  const topics = guide.topics.map((topic) => {
    if (!topic.title.includes('병해충')) {
      return topic;
    }
    return {
      icon: '🐛',
      title: PEST_TOPIC_TITLE,
      content: pestContent,
    };
  });
  return { ...guide, topics };
}

const PEST_TOPIC_TITLE = '주요 병해충 정밀 대책';

function buildPestTopicFromCard(pests: string[], cropName: string): string[] {
  const unique = [...new Set(pests.map((p) => p.trim()).filter(Boolean))];
  if (unique.length === 0) return [];

  const lines: string[] = [];
  unique.forEach((pest, idx) => {
    buildPestDetailLines(pest, cropName).forEach((line) => lines.push(line));
    if (idx < unique.length - 1) lines.push('');
  });
  return lines;
}

function buildGenericPestContent(cropName: string): string[] {
  return [
    `${cropName} 재배 시 지역·작기별 다빈 병해충은 농업기술센터·병해충 예찰표를 참고하세요.`,
    '건전 종자·윤작·적정 밀도·통풍이 기본이며, 이병주는 발견 즉시 제거합니다.',
    '화학 방제 시 안전사용 기준(희석 배수, 살포 횟수, 수확 전 안전일)을 준수하세요.',
  ];
}

/** 작물·농장·재배 경험에 맞춘 상세 가이드 생성 */
export function buildCropDetailedGuide(
  rec: CropRecommendation,
  options?: CropGuideBuildOptions,
): CropDetailedGuide {
  const cropName = rec.cropName;
  const farm = options?.recommendResult?.farmInfo;
  const experience = resolveGrowerExperience(rec, options?.recommendResult);
  const pests = rec.pests ?? [];

  const tipsTitle =
    experience === 'experienced' ? '재배 경험자·전문가 꿀팁' : '초보 농부 실패 방지 꿀팁';
  const tipsIcon = experience === 'experienced' ? '🎯' : '🚫';

  const topics: GuideTopic[] = [
    {
      icon: '🌍',
      title: '토양·수분 정밀 관리',
      content: buildSoilWaterContent(rec, farm),
    },
    {
      icon: '🐛',
      title: pests.length > 0 ? PEST_TOPIC_TITLE : '병해충 관리',
      content: pests.length > 0 ? buildPestTopicFromCard(pests, cropName) : buildGenericPestContent(cropName),
    },
    {
      icon: tipsIcon,
      title: tipsTitle,
      content: buildTipsContent(rec, experience),
    },
    {
      icon: '📦',
      title: '수확 후 관리·출하',
      content: buildHarvestContent(rec, experience),
    },
  ];

  return { cropName, topics };
}

/** @deprecated buildCropDetailedGuide(rec, options) 사용 */
export function getCropDetailedGuide(cropName: string): CropDetailedGuide {
  const stub: CropRecommendation = {
    rank: 1,
    cropId: 0,
    cropName,
    category: '채소류',
    score: 0,
    soilFitness: 'SUIT',
    soilFitnessPercent: 70,
    priceForecastPercent: 0,
    supplyStabilityPercent: 0,
    supplyStatus: 'BALANCED',
    expectedRevenuePerKg: 0,
  };
  return buildCropDetailedGuide(stub);
}
