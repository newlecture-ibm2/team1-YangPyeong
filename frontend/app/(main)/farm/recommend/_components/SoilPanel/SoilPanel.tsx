/* SoilPanel — 토양 정보 요약 · 인라인 수정 */

'use client';

import { SOIL_TYPE_OPTIONS } from '../../_lib/soilConstants';
import styles from './SoilPanel.module.css';

export interface SoilFormValues {
  soilPh: string;
  organicMatter: string;
  soilType: string;
}

interface SoilPanelProps {
  area: number;
  values: SoilFormValues;
  isSaving?: boolean;
  isDirty?: boolean;
  onChange: (field: keyof SoilFormValues, value: string) => void;
  onSave: () => void;
}

export default function SoilPanel({
  area,
  values,
  isSaving = false,
  isDirty = false,
  onChange,
  onSave,
}: SoilPanelProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.panel}>
        <div className={`${styles.card} ${styles.editable}`}>
          <div className={styles.icon}>🧪</div>
          <label className={styles.label} htmlFor="soil-ph">토양 pH</label>
          <input
            id="soil-ph"
            type="number"
            step="0.1"
            min="0"
            max="14"
            className={styles.input}
            placeholder="6.5"
            value={values.soilPh}
            onChange={(e) => onChange('soilPh', e.target.value)}
          />
        </div>

        <div className={`${styles.card} ${styles.editable} ${styles.delay1}`}>
          <div className={styles.icon}>🌱</div>
          <label className={styles.label} htmlFor="soil-om">유기물</label>
          <div className={styles.inputRow}>
            <input
              id="soil-om"
              type="number"
              step="0.1"
              min="0"
              className={styles.input}
              placeholder="2.5"
              value={values.organicMatter}
              onChange={(e) => onChange('organicMatter', e.target.value)}
            />
            <span className={styles.unitInline}>g/kg</span>
          </div>
        </div>

        <div className={`${styles.card} ${styles.readonly} ${styles.delay2}`}>
          <div className={styles.icon}>📐</div>
          <div className={styles.label}>재배 면적</div>
          <div className={styles.value}>
            {area.toLocaleString('ko-KR')}
            <span className={styles.unit}> ㎡</span>
          </div>
        </div>

        <div className={`${styles.card} ${styles.editable} ${styles.delay3}`}>
          <div className={styles.icon}>🏔️</div>
          <label className={styles.label} htmlFor="soil-type">토양 유형</label>
          <select
            id="soil-type"
            className={styles.select}
            value={values.soilType}
            onChange={(e) => onChange('soilType', e.target.value)}
          >
            {SOIL_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value || 'empty'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.footer}>
        <p className={styles.hint}>토양 정보를 저장한 뒤 「작물 적합도 다시 분석」을 누르면 순위가 갱신됩니다.</p>
        <button
          type="button"
          className={styles.saveButton}
          onClick={onSave}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? '저장 중…' : '토양 정보 저장'}
        </button>
      </div>
    </div>
  );
}
