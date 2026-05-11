/* PriceChart — SVG 가격 라인 차트 */

import { PRICE_MONTHS } from '../../_lib/recommend.constants';
import styles from './PriceChart.module.css';

interface PriceChartProps {
  data: number[];
  unit: string;
}

export default function PriceChart({ data, unit }: PriceChartProps) {
  const width = 700;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const min = Math.min(...data) * 0.9;
  const max = Math.max(...data) * 1.1;
  const range = max - min;

  const points = data.map((v, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - ((v - min) / range) * chartH,
    value: v,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const avg = Math.round(data.reduce((a, b) => a + b, 0) / data.length);

  return (
    <>
      <div className={styles.container}>
        <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartH * (1 - ratio);
            const val = Math.round(min + range * ratio);
            return (
              <g key={ratio}>
                <line x1={padding.left} y1={y} x2={padding.left + chartW} y2={y} stroke="var(--color-border)" strokeDasharray="4 2" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--color-text-secondary)">{val.toLocaleString('ko-KR')}</text>
              </g>
            );
          })}
          {PRICE_MONTHS.map((month, i) => (
            <text key={i} x={padding.left + (i / (PRICE_MONTHS.length - 1)) * chartW} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--color-text-secondary)">{month}</text>
          ))}
          <path d={areaPath} fill="url(#chartGradient)" opacity="0.3" />
          <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="var(--color-surface)" stroke="var(--color-primary)" strokeWidth="2" />
              <title>{PRICE_MONTHS[i]}: ₩{p.value.toLocaleString('ko-KR')}/{unit}</title>
            </g>
          ))}
          <defs>
            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
        </svg>
        <div className={styles.unit}>단위: ₩/{unit}</div>
      </div>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>최저가</span>
          <span className={styles.statValue}>₩{Math.min(...data).toLocaleString('ko-KR')}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>평균가</span>
          <span className={styles.statValuePrimary}>₩{avg.toLocaleString('ko-KR')}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>최고가</span>
          <span className={styles.statValue}>₩{Math.max(...data).toLocaleString('ko-KR')}</span>
        </div>
      </div>
    </>
  );
}
