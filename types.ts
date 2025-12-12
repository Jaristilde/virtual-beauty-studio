export type FinishType = 'matte' | 'gloss' | 'satin';
export type EyelinerStyle = 'natural' | 'classic' | 'winged' | 'smoky';
export type EyeshadowStyle = 'natural' | 'smoky' | 'cut_crease';
export type MakeupCategory = 'lips' | 'eyes' | 'face' | 'looks';
export type SkinImpressionMode = 'off' | 'kiss' | 'cute' | 'hollywood' | 'glamour';

export interface ColorShade {
  name: string;
  color: string; // Hex
}

export interface LipstickShade extends ColorShade {
  category: 'everyday' | 'bold' | 'classic';
}

export interface SkinAnalysisResult {
  toneCategory: 'fair' | 'light' | 'medium' | 'tan' | 'deep';
  undertone: 'warm' | 'cool' | 'neutral';
  dominantColor: string;
}

export interface FaceMeshResults {
  image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
  multiFaceLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
}

// Global types for MediaPipe
declare global {
  interface Window {
    FaceMesh: any;
    Camera: any;
  }
}

export interface MakeupState {
  lips: {
    color: string;
    opacity: number;
    finish: FinishType;
  };
  eyes: {
    shadowColor: string;
    shadowOpacity: number;
    linerColor: string;
    linerOpacity: number;
    linerStyle: EyelinerStyle;
  };
  face: {
    blushColor: string;
    blushOpacity: number;
    highlighterOpacity: number;
    highlighterColor: string;
  };
  skin: {
    impression: SkinImpressionMode;
    smoothing: number; // 0 to 1
  };
}

export interface PresetLook {
  name: string;
  description: string;
  config: MakeupState;
}