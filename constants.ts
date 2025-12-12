import { LipstickShade, ColorShade, PresetLook, SkinImpressionMode } from './types';

// High-Fidelity 468-point MediaPipe Indices
export const MESH_ANNOTATIONS = {
    // Lips
    lipsUpperOuter: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
    lipsLowerOuter: [146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
    lipsUpperInner: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308],
    lipsLowerInner: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308],
    
    // Eyes
    rightEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
    leftEye: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
    
    // Eyebrows (for reference/limits)
    rightEyebrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
    leftEyebrow: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],

    // Cheeks (Area definition for centroid calculation)
    rightCheek: [36, 205, 206, 207, 187],
    leftCheek: [266, 425, 426, 427, 411],

    // Face Contours
    faceOval: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],

    // Highlighters
    noseBridge: [6, 197, 195, 5, 4],
    noseTip: [1, 2, 98, 327],
    foreheadCenter: [10, 151, 9, 8, 168],
    
    // Eyeliner Wing Anchors
    rightEyeCorner: 33, // Inner
    rightEyeOuter: 133, // Outer
    rightEyebrowTail: 46,
    
    leftEyeCorner: 362, // Inner
    leftEyeOuter: 263, // Outer
    leftEyebrowTail: 276,
    
    // Skin Sampling
    leftCheekSample: [123, 187, 207, 205],
    rightCheekSample: [352, 411, 427, 425],
};

// --- PALETTES ---

export const LIPSTICK_PALETTE: LipstickShade[] = [
  { name: 'Bare Natural', color: '#CEB7A9', category: 'everyday' },
  { name: 'Honey Nude', color: '#C7A78C', category: 'everyday' },
  { name: 'Rose Nude', color: '#CDAFAF', category: 'everyday' },
  { name: 'Mocha', color: '#AF8C73', category: 'everyday' },
  { name: 'Soft Pink', color: '#DCAAB4', category: 'everyday' },
  { name: 'Rose Petal', color: '#C88CA0', category: 'everyday' },
  { name: 'Hot Pink', color: '#DB7093', category: 'bold' },
  { name: 'Fuchsia', color: '#FF69B4', category: 'bold' },
  { name: 'Classic Red', color: '#C84646', category: 'classic' },
  { name: 'Cherry Red', color: '#B4373C', category: 'classic' },
  { name: 'Brick Red', color: '#AF5A4B', category: 'bold' },
  { name: 'Wine', color: '#8C465A', category: 'bold' },
  { name: 'Coral Crush', color: '#E69682', category: 'everyday' },
  { name: 'Peach Kiss', color: '#EBAF96', category: 'everyday' },
  { name: 'Burnt Orange', color: '#C87850', category: 'bold' },
  { name: 'Berry Bliss', color: '#A55A78', category: 'bold' },
  { name: 'Plum Perfect', color: '#8C5064', category: 'bold' },
  { name: 'Mauve Magic', color: '#AF8291', category: 'everyday' },
  { name: 'Burgundy', color: '#78323C', category: 'bold' },
  { name: 'Deep Plum', color: '#643C50', category: 'bold' },
];

export const EYESHADOW_PALETTE: ColorShade[] = [
  { name: 'Champagne', color: '#F1DDCF' },
  { name: 'Taupe', color: '#836953' },
  { name: 'Bronze', color: '#CD7F32' },
  { name: 'Brown', color: '#5C4033' },
  { name: 'Rose Gold', color: '#B76E79' },
  { name: 'Plum', color: '#8E4585' },
  { name: 'Forest', color: '#228B22' },
  { name: 'Navy', color: '#000080' },
  { name: 'Gold Shim', color: '#FFD700' },
  { name: 'Pink Shim', color: '#FFC0CB' },
];

export const EYELINER_PALETTE: ColorShade[] = [
  { name: 'Black', color: '#000000' },
  { name: 'Brown', color: '#4A3728' },
  { name: 'Navy', color: '#000040' },
  { name: 'Purple', color: '#4B0082' },
];

export const BLUSH_PALETTE: ColorShade[] = [
  { name: 'Soft Pink', color: '#FFB7C5' },
  { name: 'Peach', color: '#FFCBA4' },
  { name: 'Coral', color: '#FF7F50' },
  { name: 'Rose', color: '#FF007F' },
  { name: 'Berry', color: '#8B0000' },
  { name: 'Bronze', color: '#CD7F32' },
];

export const HIGHLIGHTER_PALETTE: ColorShade[] = [
  { name: 'Champagne', color: '#F7E7CE' },
  { name: 'Pearl', color: '#EAE0C8' },
  { name: 'Icy', color: '#F0F8FF' },
  { name: 'Rose Gold', color: '#B76E79' },
];

// --- SKIN IMPRESSIONS ---
export const SKIN_IMPRESSIONS_CONFIG: Record<SkinImpressionMode, any> = {
    off: { 
        name: 'Natural',
        smoothing: 0, 
        overlay: null 
    },
    kiss: {
        name: 'Kiss 💋',
        smoothing: 0.4,
        warmth: 0.1,
        overlay: 'rgba(255, 182, 193, 0.1)', // Soft pink
        highlighter: { enabled: true, color: '#EAE0C8', intensity: 0.35 },
        blush: { enabled: true, color: '#FFB6C1', intensity: 0.25 },
        softFocus: true
    },
    cute: {
        name: 'Cute 🥰',
        smoothing: 0.35,
        brightness: 0.1,
        overlay: 'rgba(255, 200, 200, 0.1)',
        blush: { enabled: true, color: '#FFCBA4', intensity: 0.3 },
        eyeBrighten: true
    },
    hollywood: {
        name: 'Hollywood ⭐',
        smoothing: 0.5,
        warmth: 0.15,
        overlay: 'rgba(255, 223, 186, 0.1)', // Warm gold
        contour: { enabled: true, intensity: 0.3 },
        highlighter: { enabled: true, color: '#F7E7CE', intensity: 0.5 }
    },
    glamour: {
        name: 'Glamour 💎',
        smoothing: 0.6,
        overlay: 'rgba(0, 0, 0, 0.05)', // Contrast boost
        contour: { enabled: true, intensity: 0.4 },
        highlighter: { enabled: true, color: '#F0F8FF', intensity: 0.45 },
        contrast: 0.1
    }
};

// --- PRESETS ---

export const PRESET_LOOKS: PresetLook[] = [
  {
    name: "Natural Day",
    description: "Soft & subtle for everyday wear",
    config: {
      lips: { color: '#CDAFAF', opacity: 0.6, finish: 'satin' }, 
      eyes: { shadowColor: '#F1DDCF', shadowOpacity: 0.4, linerColor: '#4A3728', linerOpacity: 0.7, linerStyle: 'natural' },
      face: { blushColor: '#FFCBA4', blushOpacity: 0.4, highlighterOpacity: 0.3, highlighterColor: '#F7E7CE' },
      skin: { impression: 'kiss', smoothing: 0.3 }
    }
  },
  {
    name: "Office Chic",
    description: "Polished mauve tones",
    config: {
      lips: { color: '#AF8291', opacity: 0.8, finish: 'matte' }, 
      eyes: { shadowColor: '#836953', shadowOpacity: 0.5, linerColor: '#000000', linerOpacity: 0.9, linerStyle: 'classic' },
      face: { blushColor: '#FFB7C5', blushOpacity: 0.5, highlighterOpacity: 0.2, highlighterColor: '#F7E7CE' },
      skin: { impression: 'glamour', smoothing: 0.5 }
    }
  },
  {
    name: "Date Night",
    description: "Romantic warm reds",
    config: {
      lips: { color: '#C84646', opacity: 0.85, finish: 'satin' }, 
      eyes: { shadowColor: '#CD7F32', shadowOpacity: 0.7, linerColor: '#000000', linerOpacity: 1.0, linerStyle: 'winged' },
      face: { blushColor: '#FF7F50', blushOpacity: 0.6, highlighterOpacity: 0.6, highlighterColor: '#B76E79' },
      skin: { impression: 'hollywood', smoothing: 0.6 }
    }
  },
  {
    name: "Evening Glam",
    description: "Bold berry and drama",
    config: {
      lips: { color: '#78323C', opacity: 0.9, finish: 'gloss' }, 
      eyes: { shadowColor: '#FFD700', shadowOpacity: 0.7, linerColor: '#000000', linerOpacity: 1.0, linerStyle: 'smoky' },
      face: { blushColor: '#8B0000', blushOpacity: 0.7, highlighterOpacity: 0.8, highlighterColor: '#F0F8FF' },
      skin: { impression: 'glamour', smoothing: 0.7 }
    }
  },
   {
    name: "Fresh & Dewy",
    description: "Glowy peach look",
    config: {
      lips: { color: '#EBAF96', opacity: 0.6, finish: 'gloss' }, 
      eyes: { shadowColor: '#FFC0CB', shadowOpacity: 0.4, linerColor: '#4A3728', linerOpacity: 0, linerStyle: 'natural' },
      face: { blushColor: '#FF7F50', blushOpacity: 0.5, highlighterOpacity: 0.8, highlighterColor: '#EAE0C8' },
      skin: { impression: 'cute', smoothing: 0.4 }
    }
  }
];