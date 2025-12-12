import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { MESH_ANNOTATIONS, SKIN_IMPRESSIONS_CONFIG } from '../constants';
import { MakeupState, FinishType, SkinAnalysisResult, FaceMeshResults, EyelinerStyle } from '../types';
import { analyzeSkinTone, hexToRgb } from '../utils/colorUtils';

interface VirtualMirrorProps {
  makeupState: MakeupState;
  onSkinAnalyzed: (result: SkinAnalysisResult) => void;
  triggerAnalysis: boolean;
  onAnalysisComplete: () => void;
  showDebugMesh?: boolean; // NEW: Show face mesh for debugging
}

const VirtualMirror: React.FC<VirtualMirrorProps> = ({
  makeupState,
  onSkinAnalyzed,
  triggerAnalysis,
  onAnalysisComplete,
  showDebugMesh = false
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<any>(null);
  const previousLandmarksRef = useRef<any[] | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // --- TEMPORAL SMOOTHING (REDUCED FOR BETTER RESPONSIVENESS) ---
  const applyTemporalSmoothing = (newLandmarks: any[]) => {
      const SMOOTHING_FACTOR = 0.2; // REDUCED from 0.5 - more responsive tracking!
      
      if (!previousLandmarksRef.current) {
          previousLandmarksRef.current = newLandmarks;
          return newLandmarks;
      }

      const smoothed = newLandmarks.map((point, i) => {
          const prev = previousLandmarksRef.current![i];
          return {
              x: prev.x * SMOOTHING_FACTOR + point.x * (1 - SMOOTHING_FACTOR),
              y: prev.y * SMOOTHING_FACTOR + point.y * (1 - SMOOTHING_FACTOR),
              z: prev.z * SMOOTHING_FACTOR + point.z * (1 - SMOOTHING_FACTOR)
          };
      });

      previousLandmarksRef.current = smoothed;
      return smoothed;
  }

  // --- DRAWING HELPERS ---

  const getCentroid = (indices: number[], getPoint: (idx: number) => {x: number, y: number}) => {
      let sumX = 0, sumY = 0;
      indices.forEach(idx => {
          const p = getPoint(idx);
          sumX += p.x;
          sumY += p.y;
      });
      return { x: sumX / indices.length, y: sumY / indices.length };
  };

  const drawSkinImpression = (
    ctx: CanvasRenderingContext2D,
    getPoint: (idx: number) => {x: number, y: number},
    smoothing: number,
    impression: string
  ) => {
    // 1. Skin Smoothing (simulated via blur mask)
    if (smoothing > 0) {
        ctx.save();
        
        // Define Face Path
        const path = new Path2D();
        MESH_ANNOTATIONS.faceOval.forEach((idx, i) => {
            const p = getPoint(idx);
            if (i === 0) path.moveTo(p.x, p.y);
            else path.lineTo(p.x, p.y);
        });
        path.closePath();

        // Clip to face only
        ctx.clip(path);
        
        // Draw the current video frame again but blurred
        ctx.filter = `blur(${smoothing * 8}px)`; // Dynamic blur amount
        ctx.globalAlpha = smoothing * 0.7; 
        
        if (webcamRef.current?.video) {
             ctx.drawImage(webcamRef.current.video, 0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        
        ctx.restore();
    }

    // 2. Impression Overlay (Color Grading)
    const config = SKIN_IMPRESSIONS_CONFIG[impression as keyof typeof SKIN_IMPRESSIONS_CONFIG];
    if (config) {
        // Overlay color
        if (config.overlay) {
            ctx.save();
            const path = new Path2D();
            MESH_ANNOTATIONS.faceOval.forEach((idx, i) => {
                const p = getPoint(idx);
                if (i === 0) path.moveTo(p.x, p.y);
                else path.lineTo(p.x, p.y);
            });
            path.closePath();
            
            ctx.clip(path);
            ctx.fillStyle = config.overlay;
            ctx.globalCompositeOperation = 'soft-light'; 
            ctx.fill();
            ctx.restore();
        }

        // Impression-specific Blush (Auto-Apply)
        if (config.blush && config.blush.enabled) {
            drawBlush(ctx, getPoint, config.blush.color, config.blush.intensity);
        }

        // Impression-specific Highlighter (Auto-Apply)
        if (config.highlighter && config.highlighter.enabled) {
            drawHighlighter(ctx, getPoint, config.highlighter.color, config.highlighter.intensity);
        }
    }
  }

  const drawLips = (
    ctx: CanvasRenderingContext2D,
    getPoint: (idx: number) => {x: number, y: number},
    color: string,
    opacity: number,
    finish: FinishType
  ) => {
    const rgb = hexToRgb(color);
    if (!rgb || opacity === 0) return;

    const lipShape = new Path2D();
    // Outer
    MESH_ANNOTATIONS.lipsUpperOuter.forEach((idx, i) => {
      const p = getPoint(idx);
      if (i === 0) lipShape.moveTo(p.x, p.y);
      else lipShape.lineTo(p.x, p.y);
    });
    [...MESH_ANNOTATIONS.lipsLowerOuter].reverse().forEach((idx) => {
      const p = getPoint(idx);
      lipShape.lineTo(p.x, p.y);
    });
    lipShape.closePath();

    // Inner cutout
    MESH_ANNOTATIONS.lipsUpperInner.forEach((idx, i) => {
      const p = getPoint(idx);
      if (i === 0) lipShape.moveTo(p.x, p.y);
      else lipShape.lineTo(p.x, p.y);
    });
    [...MESH_ANNOTATIONS.lipsLowerInner].reverse().forEach((idx) => {
      const p = getPoint(idx);
      lipShape.lineTo(p.x, p.y);
    });
    lipShape.closePath();

    ctx.save();
    ctx.filter = 'blur(1.5px)';
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    
    if (finish === 'gloss') ctx.globalCompositeOperation = 'overlay';
    else if (finish === 'satin') ctx.globalCompositeOperation = 'soft-light';
    else ctx.globalCompositeOperation = 'multiply'; 
    
    ctx.fill(lipShape, 'evenodd');

    if (finish === 'gloss') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'blur(4px)';
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
        const lowerCenter = getPoint(17); 
        ctx.beginPath();
        ctx.ellipse(lowerCenter.x, lowerCenter.y, 12, 6, 0, 0, 2 * Math.PI);
        ctx.fill();
    }
    ctx.restore();
  };

  const drawEyeshadow = (
    ctx: CanvasRenderingContext2D,
    getPoint: (idx: number) => {x: number, y: number},
    color: string,
    opacity: number
  ) => {
    const rgb = hexToRgb(color);
    if (!rgb || opacity === 0) return;

    const drawEyeRegion = (eyeIndices: number[], browIndices: number[]) => {
       const path = new Path2D();
       // Top eyelid (approximate from first half of eye indices)
       const upperLid = eyeIndices.slice(0, 8); // Top half of eye loop
       
       upperLid.forEach((idx, i) => {
           const p = getPoint(idx);
           if (i === 0) path.moveTo(p.x, p.y);
           else path.lineTo(p.x, p.y);
       });
       
       // Connect to brow reversed
       [...browIndices].reverse().forEach((idx) => {
           const p = getPoint(idx);
           path.lineTo(p.x, p.y);
       });
       path.closePath();
       
       ctx.save();
       ctx.filter = 'blur(8px)';
       ctx.globalCompositeOperation = 'source-over'; 
       ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity * 0.6})`;
       ctx.fill(path);
       ctx.restore();
    }

    drawEyeRegion(MESH_ANNOTATIONS.leftEye, MESH_ANNOTATIONS.leftEyebrow);
    drawEyeRegion(MESH_ANNOTATIONS.rightEye, MESH_ANNOTATIONS.rightEyebrow);
  };

  const drawEyeliner = (
    ctx: CanvasRenderingContext2D,
    getPoint: (idx: number) => {x: number, y: number},
    color: string,
    opacity: number,
    style: EyelinerStyle
  ) => {
    const rgb = hexToRgb(color);
    if (!rgb || opacity === 0) return;
    
    const drawLine = (eyeIndices: number[], cornerIdx: number, outerIdx: number, browTailIdx: number, isRight: boolean) => {
        ctx.beginPath();
        
        // Upper lash line (indices 0-8 in our 16-point eye loop)
        const upperLid = eyeIndices.slice(0, 9);
        
        upperLid.forEach((idx, i) => {
            const p = getPoint(idx);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });

        // Wing Logic
        if (style === 'winged' || style === 'classic' || style === 'smoky') {
             const outer = getPoint(outerIdx);
             const browTail = getPoint(browTailIdx);
             
             // Calculate wing vector
             const dx = browTail.x - outer.x;
             const dy = browTail.y - outer.y;
             const len = Math.sqrt(dx*dx + dy*dy);
             
             // Wing parameters
             const wingLen = style === 'winged' ? 0.25 : 0.15;
             const endX = outer.x + (dx/len) * (len * wingLen);
             const endY = outer.y + (dy/len) * (len * wingLen);

             // Draw wing tip
             ctx.lineTo(endX, endY);
             
             // Return to eyelid (create thickness)
             const returnIdx = eyeIndices[7]; // Slightly inside
             const returnP = getPoint(returnIdx);
             ctx.lineTo(returnP.x, returnP.y);
        }

        ctx.save();
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (style === 'smoky') {
            ctx.lineWidth = 5;
            ctx.filter = 'blur(4px)';
        } else {
            ctx.lineWidth = style === 'natural' ? 3 : 5;
            ctx.filter = 'blur(0.5px)';
        }
        
        ctx.stroke();
        ctx.fill();
        ctx.restore();
    }
    
    // Left Eye
    drawLine(MESH_ANNOTATIONS.leftEye, MESH_ANNOTATIONS.leftEyeCorner, MESH_ANNOTATIONS.leftEyeOuter, MESH_ANNOTATIONS.leftEyebrowTail, false);
    // Right Eye
    drawLine(MESH_ANNOTATIONS.rightEye, MESH_ANNOTATIONS.rightEyeCorner, MESH_ANNOTATIONS.rightEyeOuter, MESH_ANNOTATIONS.rightEyebrowTail, true);
  };

  const drawBlush = (
    ctx: CanvasRenderingContext2D,
    getPoint: (idx: number) => {x: number, y: number},
    color: string | {r:number,g:number,b:number},
    opacity: number
  ) => {
    const rgb = typeof color === 'string' ? hexToRgb(color) : color;
    if (!rgb || opacity === 0) return;

    // Use Centroids of cheek regions for perfect placement
    const rightCenter = getCentroid(MESH_ANNOTATIONS.rightCheek, getPoint);
    const leftCenter = getCentroid(MESH_ANNOTATIONS.leftCheek, getPoint);

    const drawCheek = (center: {x:number, y:number}) => {
        // Dynamic radius based on face width
        const faceWidth = Math.abs(getPoint(454).x - getPoint(234).x);
        const radius = faceWidth * 0.15;

        const grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity * 0.6})`);
        grad.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity * 0.3})`);
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        ctx.save();
        ctx.globalCompositeOperation = 'multiply'; // Blends naturally
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }

    drawCheek(rightCenter);
    drawCheek(leftCenter);
  }

  const drawHighlighter = (
    ctx: CanvasRenderingContext2D,
    getPoint: (idx: number) => {x: number, y: number},
    color: string,
    opacity: number
  ) => {
    const rgb = hexToRgb(color);
    if (!rgb || opacity === 0) return;

    const drawSpot = (indices: number[], spread: number = 10, intensityMult: number = 1) => {
        const center = getCentroid(indices.length ? indices : [indices as any], getPoint);
        
        const grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, spread);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity * intensityMult})`);
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(center.x, center.y, spread, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.save();
    ctx.globalCompositeOperation = 'screen'; // Adds light
    ctx.filter = 'blur(4px)';
    
    // 1. Nose Bridge (Linear)
    const noseTop = getPoint(MESH_ANNOTATIONS.noseBridge[0]);
    const noseBot = getPoint(MESH_ANNOTATIONS.noseBridge[4]);
    const noseGrad = ctx.createLinearGradient(noseTop.x, noseTop.y, noseBot.x, noseBot.y);
    noseGrad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
    noseGrad.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`);
    noseGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
    
    ctx.lineWidth = 12;
    ctx.strokeStyle = noseGrad;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(noseTop.x, noseTop.y);
    ctx.lineTo(noseBot.x, noseBot.y);
    ctx.stroke();

    // 2. Cheekbones (High points)
    // Use indices 116 (right) and 345 (left) for high cheekbone
    const rightCheekBone = getPoint(116);
    const leftCheekBone = getPoint(345);
    
    const drawGlow = (cx: number, cy: number) => {
         const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 25);
         grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity * 0.8})`);
         grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
         ctx.fillStyle = grad;
         ctx.beginPath();
         ctx.arc(cx, cy, 25, 0, Math.PI*2);
         ctx.fill();
    }
    drawGlow(rightCheekBone.x, rightCheekBone.y);
    drawGlow(leftCheekBone.x, leftCheekBone.y);

    // 3. Cupids Bow
    drawSpot([0], 8, 0.8);

    // 4. Brow Bone (optional subtle glow)
    drawSpot([107], 12, 0.5); // Right
    drawSpot([336], 12, 0.5); // Left
    
    ctx.restore();
  }

  const performSkinAnalysis = (
    ctx: CanvasRenderingContext2D,
    getPoint: (idx: number) => {x: number, y: number},
    landmarks: { x: number; y: number }[]
  ) => {
    const sampleRegion = (indices: number[]) => {
      let r = 0, g = 0, b = 0, count = 0;
      indices.forEach(idx => {
        const p = getPoint(idx);
        const x = Math.floor(p.x);
        const y = Math.floor(p.y);
        const imageData = ctx.getImageData(x - 1, y - 1, 3, 3);
        for(let i = 0; i < imageData.data.length; i += 4) {
          r += imageData.data[i];
          g += imageData.data[i + 1];
          b += imageData.data[i + 2];
          count++;
        }
      });
      return { r: r/count, g: g/count, b: b/count };
    };

    const cheekColor = sampleRegion(MESH_ANNOTATIONS.leftCheekSample);
    const result = analyzeSkinTone(cheekColor.r, cheekColor.g, cheekColor.b);
    onSkinAnalyzed(result);
  };

  const onResults = useCallback(
    (results: FaceMeshResults) => {
      if (!canvasRef.current || !webcamRef.current?.video) return;

      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // 1. Draw Video
      ctx.save();
      ctx.clearRect(0, 0, videoWidth, videoHeight);
      ctx.drawImage(results.image as unknown as CanvasImageSource, 0, 0, videoWidth, videoHeight);
      
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        // SMOOTH LANDMARKS
        const rawLandmarks = results.multiFaceLandmarks[0];
        const landmarks = applyTemporalSmoothing(rawLandmarks);

        const getPoint = (index: number) => ({
            x: landmarks[index].x * videoWidth,
            y: landmarks[index].y * videoHeight,
        });

        // 2. Analysis
        if (triggerAnalysis) {
           performSkinAnalysis(ctx, getPoint, landmarks);
           onAnalysisComplete();
        }

        // 3. MAKEUP PIPELINE (Order is critical)
        
        // A. Skin Base (Smoothing & Impression Filters)
        drawSkinImpression(ctx, getPoint, makeupState.skin.smoothing, makeupState.skin.impression);

        // B. Base Makeup (Blush & Contour)
        drawBlush(ctx, getPoint, makeupState.face.blushColor, makeupState.face.blushOpacity);
        
        // C. Glow (Highlighter)
        drawHighlighter(ctx, getPoint, makeupState.face.highlighterColor, makeupState.face.highlighterOpacity);

        // D. Eyes
        drawEyeshadow(ctx, getPoint, makeupState.eyes.shadowColor, makeupState.eyes.shadowOpacity);
        drawEyeliner(ctx, getPoint, makeupState.eyes.linerColor, makeupState.eyes.linerOpacity, makeupState.eyes.linerStyle);

        // E. Lips (Last to sit on top)
        drawLips(ctx, getPoint, makeupState.lips.color, makeupState.lips.opacity, makeupState.lips.finish);

        // F. DEBUG: Draw face mesh landmarks (if enabled)
        if (showDebugMesh) {
          ctx.save();
          ctx.fillStyle = '#00ff00';
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 1;
          
          // Draw all 468 landmarks as small green dots
          landmarks.forEach((landmark: any, index: number) => {
            const x = landmark.x * videoWidth;
            const y = landmark.y * videoHeight;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fill();
          });
          
          // Draw key landmarks in red (lips, eyes)
          ctx.fillStyle = '#ff0000';
          [...MESH_ANNOTATIONS.lipsUpperOuter, ...MESH_ANNOTATIONS.lipsLowerOuter].forEach(idx => {
            const p = getPoint(idx);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
            ctx.fill();
          });
          
          // Draw eye landmarks in blue
          ctx.fillStyle = '#0000ff';
          [...MESH_ANNOTATIONS.leftEye, ...MESH_ANNOTATIONS.rightEye].forEach(idx => {
            const p = getPoint(idx);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
            ctx.fill();
          });
          
          ctx.restore();
        }
      }
      ctx.restore();
    },
    [makeupState, triggerAnalysis, onAnalysisComplete, onSkinAnalyzed, showDebugMesh]
  );

  useEffect(() => {
    const faceMesh = new window.FaceMesh({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true, // CRITICAL: Enables iris and lip tracking
      minDetectionConfidence: 0.7, // INCREASED for better accuracy
      minTrackingConfidence: 0.7, // INCREASED for better tracking
    });
    
    faceMeshRef.current = faceMesh;

    if (
      typeof window.Camera !== 'undefined' &&
      webcamRef.current &&
      webcamRef.current.video
    ) {
      const camera = new window.Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current && webcamRef.current.video && faceMeshRef.current) {
            await faceMeshRef.current.send({ image: webcamRef.current.video });
          }
        },
        width: 1280,
        height: 720,
      });
      camera.start();
      setIsCameraReady(true);
    }
  }, []);

  useEffect(() => {
    if (faceMeshRef.current) {
      faceMeshRef.current.onResults(onResults);
    }
  }, [onResults]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        {!isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center z-50 bg-gray-900 text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p>Loading Beauty Engine...</p>
                </div>
            </div>
        )}
      <Webcam
        ref={webcamRef}
        audio={false}
        width={1280}
        height={720}
        screenshotFormat="image/jpeg"
        className="hidden"
        videoConstraints={{
            width: 1280,
            height: 720,
            facingMode: "user"
        }}
      />
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain transform scale-x-[-1]"
        style={{ imageRendering: 'auto' }}
      />
    </div>
  );
};

export default VirtualMirror;