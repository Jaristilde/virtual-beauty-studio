import { LANDMARKS_68 } from '../hooks/useFaceDetection68';
import { MakeupState, FinishType, EyelinerStyle } from '../types';
import { hexToRgb } from './colorUtils';

interface Point {
  x: number;
  y: number;
}

/**
 * Makeup Renderer using 68-point landmark model
 * Matches Python blink_detector.py landmark indices
 */
export class MakeupRenderer68 {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { willReadFrequently: false });
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;
  }

  render(
    video: HTMLVideoElement,
    landmarks: Point[],
    makeupState: MakeupState
  ) {
    if (landmarks.length !== 68) {
      console.warn('Expected 68 landmarks, got:', landmarks.length);
      return;
    }

    // Clear and draw video (mirrored for selfie view)
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(video, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    // Mirror landmarks to match flipped video
    const mirroredLandmarks = landmarks.map(p => ({
      x: this.canvas.width - p.x,
      y: p.y
    }));

    // Apply makeup in correct layering order
    // 1. Skin base (from skin impression settings)
    if (makeupState.skin.smoothing > 0) {
      this.applySkinSmoothing(mirroredLandmarks, makeupState.skin.smoothing);
    }

    // 2. Blush (base color)
    if (makeupState.face.blushOpacity > 0) {
      this.renderBlush(mirroredLandmarks, makeupState.face.blushColor, makeupState.face.blushOpacity);
    }

    // 3. Highlighter (glow)
    if (makeupState.face.highlighterOpacity > 0) {
      this.renderHighlighter(mirroredLandmarks, makeupState.face.highlighterColor, makeupState.face.highlighterOpacity);
    }

    // 4. Eyeshadow
    if (makeupState.eyes.shadowOpacity > 0) {
      this.renderEyeshadow(mirroredLandmarks, makeupState.eyes.shadowColor, makeupState.eyes.shadowOpacity);
    }

    // 5. Eyeliner
    if (makeupState.eyes.linerOpacity > 0) {
      this.renderEyeliner(mirroredLandmarks, makeupState.eyes.linerColor, makeupState.eyes.linerOpacity, makeupState.eyes.linerStyle);
    }

    // 6. Lipstick (top layer)
    if (makeupState.lips.opacity > 0) {
      this.renderLipstick(mirroredLandmarks, makeupState.lips.color, makeupState.lips.opacity, makeupState.lips.finish);
    }
  }

  /**
   * LIPSTICK - Using Python indices 48-67
   * Outer lip: 48-59, Inner lip: 60-67
   */
  private renderLipstick(landmarks: Point[], color: string, opacity: number, finish: FinishType) {
    const rgb = hexToRgb(color);
    if (!rgb || opacity === 0) return;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'multiply';
    this.ctx.globalAlpha = opacity;
    this.ctx.filter = 'blur(1px)';

    // Get lip points using Python indices
    const outerLip = LANDMARKS_68.OUTER_LIP.map(i => landmarks[i]);
    const innerLip = LANDMARKS_68.INNER_LIP.map(i => landmarks[i]);

    // Draw outer lip shape
    this.ctx.beginPath();
    this.ctx.moveTo(outerLip[0].x, outerLip[0].y);
    outerLip.forEach(p => this.ctx.lineTo(p.x, p.y));
    this.ctx.closePath();

    // Cut out inner mouth (teeth visible when mouth open)
    this.ctx.moveTo(innerLip[0].x, innerLip[0].y);
    for (let i = innerLip.length - 1; i >= 0; i--) {
      this.ctx.lineTo(innerLip[i].x, innerLip[i].y);
    }
    this.ctx.closePath();

    this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
    this.ctx.fill('evenodd');

    // Gloss effect for glossy finish
    if (finish === 'gloss') {
      this.ctx.globalCompositeOperation = 'soft-light';
      this.ctx.globalAlpha = 0.6;
      this.ctx.filter = 'blur(3px)';

      const lipCenter = landmarks[LANDMARKS_68.LOWER_LIP_BOTTOM]; // Point 57
      const gradient = this.ctx.createRadialGradient(
        lipCenter.x, lipCenter.y, 0,
        lipCenter.x, lipCenter.y, 18
      );
      gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');

      this.ctx.beginPath();
      this.ctx.arc(lipCenter.x, lipCenter.y, 18, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  /**
   * EYELINER - Using Python indices 36-47
   * Right eye: 36-41, Left eye: 42-47
   */
  private renderEyeliner(landmarks: Point[], color: string, opacity: number, style: EyelinerStyle) {
    const rgb = hexToRgb(color);
    if (!rgb || opacity === 0) return;

    this.ctx.save();
    this.ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    this.ctx.lineWidth = style === 'smoky' ? 4 : (style === 'natural' ? 2 : 3);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.filter = style === 'smoky' ? 'blur(3px)' : 'blur(0.5px)';

    // Right eye upper lash line (36-37-38-39)
    const rightEye = LANDMARKS_68.RIGHT_EYE.map(i => landmarks[i]);
    this.ctx.beginPath();
    this.ctx.moveTo(rightEye[0].x, rightEye[0].y); // 36
    this.ctx.lineTo(rightEye[1].x, rightEye[1].y); // 37
    this.ctx.lineTo(rightEye[2].x, rightEye[2].y); // 38
    this.ctx.lineTo(rightEye[3].x, rightEye[3].y); // 39

    // Add wing if winged or classic style
    if (style === 'winged' || style === 'classic') {
      const eyebrowTip = landmarks[LANDMARKS_68.RIGHT_EYEBROW[4]]; // Point 21
      const outerCorner = rightEye[0]; // Point 36
      
      const angle = Math.atan2(
        eyebrowTip.y - outerCorner.y,
        eyebrowTip.x - outerCorner.x
      );
      
      const wingLength = style === 'winged' ? 15 : 10;
      const wingTip = {
        x: outerCorner.x + Math.cos(angle) * wingLength,
        y: outerCorner.y + Math.sin(angle) * wingLength
      };
      
      this.ctx.lineTo(wingTip.x, wingTip.y);
      this.ctx.lineTo(rightEye[1].x, rightEye[1].y); // Back to create thickness
    }
    
    this.ctx.stroke();
    if (style === 'winged' || style === 'classic') {
      this.ctx.fill();
    }

    // Left eye upper lash line (42-43-44-45)
    const leftEye = LANDMARKS_68.LEFT_EYE.map(i => landmarks[i]);
    this.ctx.beginPath();
    this.ctx.moveTo(leftEye[0].x, leftEye[0].y); // 42
    this.ctx.lineTo(leftEye[1].x, leftEye[1].y); // 43
    this.ctx.lineTo(leftEye[2].x, leftEye[2].y); // 44
    this.ctx.lineTo(leftEye[3].x, leftEye[3].y); // 45

    if (style === 'winged' || style === 'classic') {
      const eyebrowTip = landmarks[LANDMARKS_68.LEFT_EYEBROW[0]]; // Point 22
      const outerCorner = leftEye[3]; // Point 45
      
      const angle = Math.atan2(
        eyebrowTip.y - outerCorner.y,
        eyebrowTip.x - outerCorner.x
      );
      
      const wingLength = style === 'winged' ? 15 : 10;
      const wingTip = {
        x: outerCorner.x + Math.cos(angle) * wingLength,
        y: outerCorner.y + Math.sin(angle) * wingLength
      };
      
      this.ctx.lineTo(wingTip.x, wingTip.y);
      this.ctx.lineTo(leftEye[2].x, leftEye[2].y);
    }
    
    this.ctx.stroke();
    if (style === 'winged' || style === 'classic') {
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  /**
   * EYESHADOW - Between eyes (36-47) and eyebrows (17-26)
   */
  private renderEyeshadow(landmarks: Point[], color: string, opacity: number) {
    const rgb = hexToRgb(color);
    if (!rgb || opacity === 0) return;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'multiply';
    this.ctx.globalAlpha = opacity * 0.7;
    this.ctx.filter = 'blur(8px)';
    this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;

    // Right eyeshadow: between eye and eyebrow
    const rightEye = LANDMARKS_68.RIGHT_EYE.map(i => landmarks[i]);
    const rightBrow = LANDMARKS_68.RIGHT_EYEBROW.map(i => landmarks[i]);

    this.ctx.beginPath();
    this.ctx.moveTo(rightEye[0].x, rightEye[0].y); // 36
    this.ctx.lineTo(rightEye[1].x, rightEye[1].y - 3); // 37
    this.ctx.lineTo(rightEye[2].x, rightEye[2].y - 3); // 38
    this.ctx.lineTo(rightEye[3].x, rightEye[3].y); // 39
    
    // Connect to eyebrow
    rightBrow.slice().reverse().forEach(p => this.ctx.lineTo(p.x, p.y + 3));
    this.ctx.closePath();
    this.ctx.fill();

    // Left eyeshadow: between eye and eyebrow
    const leftEye = LANDMARKS_68.LEFT_EYE.map(i => landmarks[i]);
    const leftBrow = LANDMARKS_68.LEFT_EYEBROW.map(i => landmarks[i]);

    this.ctx.beginPath();
    this.ctx.moveTo(leftEye[0].x, leftEye[0].y); // 42
    this.ctx.lineTo(leftEye[1].x, leftEye[1].y - 3); // 43
    this.ctx.lineTo(leftEye[2].x, leftEye[2].y - 3); // 44
    this.ctx.lineTo(leftEye[3].x, leftEye[3].y); // 45
    
    leftBrow.slice().reverse().forEach(p => this.ctx.lineTo(p.x, p.y + 3));
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  /**
   * BLUSH - Cheek area calculated from eye and jaw points
   * Like Python: between outer eye and jaw
   */
  private renderBlush(landmarks: Point[], color: string, opacity: number) {
    const rgb = hexToRgb(color);
    if (!rgb || opacity === 0) return;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'multiply';
    this.ctx.globalAlpha = opacity;

    // Calculate right cheek: between outer eye (36) and jaw (3)
    const rightEyeOuter = landmarks[LANDMARKS_68.RIGHT_EYE_OUTER]; // 36
    const rightJaw = landmarks[3];
    const rightCheek = {
      x: (rightEyeOuter.x + rightJaw.x) / 2 + 5,
      y: (rightEyeOuter.y + rightJaw.y) / 2
    };

    // Calculate left cheek: between outer eye (45) and jaw (13)
    const leftEyeOuter = landmarks[LANDMARKS_68.LEFT_EYE_OUTER]; // 45
    const leftJaw = landmarks[13];
    const leftCheek = {
      x: (leftEyeOuter.x + leftJaw.x) / 2 - 5,
      y: (leftEyeOuter.y + leftJaw.y) / 2
    };

    // Calculate blush radius based on face width
    const faceWidth = Math.abs(landmarks[0].x - landmarks[16].x);
    const blushRadius = faceWidth * 0.15;

    // Draw blush on both cheeks
    [rightCheek, leftCheek].forEach(cheek => {
      const gradient = this.ctx.createRadialGradient(
        cheek.x, cheek.y, 0,
        cheek.x, cheek.y, blushRadius
      );
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);
      gradient.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      this.ctx.beginPath();
      this.ctx.arc(cheek.x, cheek.y, blushRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  /**
   * HIGHLIGHTER - Nose bridge (27-30) and cheekbones
   */
  private renderHighlighter(landmarks: Point[], color: string, opacity: number) {
    const rgb = hexToRgb(color);
    if (!rgb || opacity === 0) return;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'soft-light';
    this.ctx.globalAlpha = opacity;
    this.ctx.filter = 'blur(5px)';

    // Nose bridge highlight (points 27-30)
    const noseBridge = LANDMARKS_68.NOSE_BRIDGE.map(i => landmarks[i]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(noseBridge[0].x - 3, noseBridge[0].y);
    noseBridge.forEach(p => this.ctx.lineTo(p.x, p.y));
    this.ctx.lineTo(noseBridge[noseBridge.length - 1].x + 3, noseBridge[noseBridge.length - 1].y);
    noseBridge.slice().reverse().forEach(p => this.ctx.lineTo(p.x + 3, p.y));
    this.ctx.closePath();
    this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
    this.ctx.fill();

    // Cheekbone highlights (above blush area)
    const rightHighlight = {
      x: landmarks[LANDMARKS_68.RIGHT_EYE_OUTER].x + 10, // 36
      y: landmarks[LANDMARKS_68.RIGHT_EYE_OUTER].y + 15
    };
    
    const leftHighlight = {
      x: landmarks[LANDMARKS_68.LEFT_EYE_OUTER].x - 10, // 45
      y: landmarks[LANDMARKS_68.LEFT_EYE_OUTER].y + 15
    };

    [rightHighlight, leftHighlight].forEach(point => {
      const gradient = this.ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, 25
      );
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`);
      gradient.addColorStop(1, 'rgba(255,255,255,0)');

      this.ctx.beginPath();
      this.ctx.ellipse(point.x, point.y, 30, 12, Math.PI / 6, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    });

    // Cupid's bow highlight (point 51)
    const cupidsBow = landmarks[LANDMARKS_68.UPPER_LIP_TOP];
    const bowGradient = this.ctx.createRadialGradient(
      cupidsBow.x, cupidsBow.y - 2, 0,
      cupidsBow.x, cupidsBow.y - 2, 8
    );
    bowGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);
    bowGradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    this.ctx.beginPath();
    this.ctx.arc(cupidsBow.x, cupidsBow.y - 2, 8, 0, Math.PI * 2);
    this.ctx.fillStyle = bowGradient;
    this.ctx.fill();

    this.ctx.restore();
  }

  /**
   * SKIN SMOOTHING - Blur effect within face boundary
   */
  private applySkinSmoothing(landmarks: Point[], smoothing: number) {
    if (smoothing === 0) return;

    this.ctx.save();
    
    // Create face path using jaw points (0-16)
    const facePath = new Path2D();
    const jawPoints = LANDMARKS_68.JAW.map(i => landmarks[i]);
    
    facePath.moveTo(jawPoints[0].x, jawPoints[0].y);
    jawPoints.forEach(p => facePath.lineTo(p.x, p.y));
    // Complete the face oval by connecting to top
    const foreheadY = landmarks[19].y - 40; // Estimate forehead
    facePath.lineTo(landmarks[16].x, foreheadY);
    facePath.lineTo(landmarks[0].x, foreheadY);
    facePath.closePath();

    // Clip to face area and apply blur
    this.ctx.clip(facePath);
    this.ctx.filter = `blur(${smoothing * 6}px)`;
    this.ctx.globalAlpha = smoothing * 0.6;
    
    // Redraw the current canvas content with blur
    this.ctx.drawImage(this.canvas, 0, 0);

    this.ctx.restore();
  }

  /**
   * DEBUG: Draw all 68 landmarks
   */
  drawDebugLandmarks(landmarks: Point[]) {
    if (landmarks.length !== 68) return;

    this.ctx.save();
    
    // Mirror landmarks
    const mirroredLandmarks = landmarks.map(p => ({
      x: this.canvas.width - p.x,
      y: p.y
    }));

    // Draw all points in green
    this.ctx.fillStyle = '#00ff00';
    mirroredLandmarks.forEach((p, i) => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Label key points
      if (i % 10 === 0) {
        this.ctx.fillText(i.toString(), p.x + 5, p.y - 5);
      }
    });

    // Highlight lips in red
    this.ctx.fillStyle = '#ff0000';
    LANDMARKS_68.OUTER_LIP.forEach(i => {
      this.ctx.beginPath();
      this.ctx.arc(mirroredLandmarks[i].x, mirroredLandmarks[i].y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Highlight eyes in blue
    this.ctx.fillStyle = '#0000ff';
    [...LANDMARKS_68.RIGHT_EYE, ...LANDMARKS_68.LEFT_EYE].forEach(i => {
      this.ctx.beginPath();
      this.ctx.arc(mirroredLandmarks[i].x, mirroredLandmarks[i].y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
  }
}

