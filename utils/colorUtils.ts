import { SkinAnalysisResult } from '../types';

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const rgbToHsv = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const v = max;
  const d = max - min;

  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h, s, v };
};

export const analyzeSkinTone = (
  r: number,
  g: number,
  b: number
): SkinAnalysisResult => {
  const { h, s, v } = rgbToHsv(r, g, b);

  let toneCategory: SkinAnalysisResult['toneCategory'] = 'medium';
  if (v > 0.85) toneCategory = 'fair';
  else if (v > 0.75) toneCategory = 'light';
  else if (v > 0.6) toneCategory = 'medium';
  else if (v > 0.45) toneCategory = 'tan';
  else toneCategory = 'deep';

  let undertone: SkinAnalysisResult['undertone'] = 'neutral';
  if (h < 0.05) undertone = 'cool'; // More red
  else if (h > 0.1) undertone = 'warm'; // More yellow
  else undertone = 'neutral';

  return {
    toneCategory,
    undertone,
    dominantColor: `rgb(${r}, ${g}, ${b})`,
  };
};

export const getRecommendedShades = (analysis: SkinAnalysisResult) => {
  const { toneCategory, undertone } = analysis;

  if (undertone === 'warm') {
    return ['Coral Crush', 'Peach Kiss', 'Brick Red', 'Burnt Orange', 'Honey Nude'];
  } else if (undertone === 'cool') {
    return ['Soft Pink', 'Fuchsia', 'Berry Bliss', 'Wine', 'Rose Petal'];
  } else {
    return ['Classic Red', 'Mauve Magic', 'Rose Nude', 'Mocha', 'Burgundy'];
  }
};