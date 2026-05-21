export const SOIL_TYPE_OPTIONS = [
  { value: '', label: '선택 안 함' },
  { value: 'sand', label: '사질토' },
  { value: 'loam', label: '양토' },
  { value: 'clay', label: '점토' },
  { value: 'sandy_loam', label: '사양토' },
] as const;

export function soilTypeLabel(value?: string | null): string {
  if (!value) return '—';
  return SOIL_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
