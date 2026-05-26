/** crop_cultivation_env 시드와 동일한 파종·수확 fallback — cropPeriodRegistry 위임 */

import { resolveCropPeriodLabels } from './cropPeriodRegistry';

export function normCropName(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase();
}

export function resolveCropPeriodFallback(cropName: string): { sowing?: string; harvest?: string } {
  return resolveCropPeriodLabels(cropName);
}
