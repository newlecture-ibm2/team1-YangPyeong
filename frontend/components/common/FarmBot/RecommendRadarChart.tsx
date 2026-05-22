'use client';

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { RecommendChartItem } from '@/lib/chat-types';
import styles from './RecommendRadarChart.module.css';

interface Props {
  data: RecommendChartItem[];
}

export default function RecommendRadarChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  // recharts에 맞게 데이터 변환
  // recharts RadarChart는 기준점(subject)별로 각 작물의 점수를 가져야 함
  // { subject: '토양', 감자: 90, 배추: 60 }
  
  const subjects = [
    { key: 'score', label: '종합 점수' },
    { key: 'soil', label: '토양 적합도' },
    { key: 'price', label: '시세 전망' },
    { key: 'supply', label: '수급 안정성' },
  ];

  const chartData = subjects.map((subj) => {
    const row: any = { subject: subj.label };
    data.forEach((item) => {
      row[item.cropName] = item[subj.key as keyof RecommendChartItem];
    });
    return row;
  });

  // 차트 색상 팔레트 (최대 3개 작물 비교 가정)
  const colors = ['#22c55e', '#3b82f6', '#f59e0b'];

  return (
    <div className={styles.chartContainer}>
      <h4 className={styles.chartTitle}>📊 AI 비교 분석 차트</h4>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 600 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            {data.map((item, index) => (
              <Radar
                key={item.cropName}
                name={item.cropName}
                dataKey={item.cropName}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.4}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
