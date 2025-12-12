import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

// 68-point landmark indices - EXACTLY matching Python blink_detector.py
export const LANDMARKS_68 = {
  // Jaw/Face contour: points 0-16 (17 points)
  JAW: Array.from({ length: 17 }, (_, i) => i),
  
  // Right eyebrow: points 17-21 (5 points)
  RIGHT_EYEBROW: [17, 18, 19, 20, 21],
  
  // Left eyebrow: points 22-26 (5 points)
  LEFT_EYEBROW: [22, 23, 24, 25, 26],
  
  // Nose bridge: points 27-30 (4 points)
  NOSE_BRIDGE: [27, 28, 29, 30],
  
  // Nose bottom: points 31-35 (5 points)
  NOSE_BOTTOM: [31, 32, 33, 34, 35],
  NOSE_TIP: 33,
  
  // Right eye: points 36-41 (6 points) - FROM PYTHON CODE
  RIGHT_EYE: [36, 37, 38, 39, 40, 41],
  RIGHT_EYE_OUTER: 36,  // landmarks[36]
  RIGHT_EYE_INNER: 39,  // landmarks[39]
  
  // Left eye: points 42-47 (6 points) - FROM PYTHON CODE
  LEFT_EYE: [42, 43, 44, 45, 46, 47],
  LEFT_EYE_INNER: 42,  // landmarks[42]
  LEFT_EYE_OUTER: 45,  // landmarks[45]
  
  // Outer lip: points 48-59 (12 points)
  OUTER_LIP: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
  
  // Inner lip: points 60-67 (8 points)
  INNER_LIP: [60, 61, 62, 63, 64, 65, 66, 67],
  
  // Specific lip points
  UPPER_LIP_TOP: 51,      // Top center of upper lip
  LOWER_LIP_BOTTOM: 57,   // Bottom center of lower lip
  LEFT_LIP_CORNER: 48,    // Left corner
  RIGHT_LIP_CORNER: 54,   // Right corner
  
  // Eye aspect ratio points (FROM PYTHON get_eye_aspect_ratio)
  // Right eye vertical distances
  RIGHT_EYE_VERT_1_TOP: 37,     // vert_dist_1right
  RIGHT_EYE_VERT_1_BOTTOM: 41,
  RIGHT_EYE_VERT_2_TOP: 38,     // vert_dist_2right
  RIGHT_EYE_VERT_2_BOTTOM: 40,
  
  // Left eye vertical distances
  LEFT_EYE_VERT_1_TOP: 43,      // vert_dist_1left
  LEFT_EYE_VERT_1_BOTTOM: 47,
  LEFT_EYE_VERT_2_TOP: 44,      // vert_dist_2left
  LEFT_EYE_VERT_2_BOTTOM: 46,
};

interface Point {
  x: number;
  y: number;
}

interface FaceDetectionHook {
  landmarks: Point[] | null;
  isLoading: boolean;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  faceDetected: boolean;
}

export const useFaceDetection68 = (): FaceDetectionHook => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarks, setLandmarks] = useState<Point[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  
  // Temporal smoothing for stability (like Python code smoothing)
  const prevLandmarksRef = useRef<Point[] | null>(null);
  const SMOOTHING = 0.3; // Moderate smoothing for stability
  
  const smoothLandmarks = useCallback((newPoints: Point[]): Point[] => {
    if (!prevLandmarksRef.current || prevLandmarksRef.current.length !== 68) {
      prevLandmarksRef.current = newPoints;
      return newPoints;
    }
    
    const smoothed = newPoints.map((point, i) => ({
      x: prevLandmarksRef.current![i].x * SMOOTHING + point.x * (1 - SMOOTHING),
      y: prevLandmarksRef.current![i].y * SMOOTHING + point.y * (1 - SMOOTHING),
    }));
    
    prevLandmarksRef.current = smoothed;
    return smoothed;
  }, []);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Loading face-api.js models...');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        console.log('✓ Face-api.js models loaded (68-point landmark model)');
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load face detection models:', err);
        setError('Failed to load face detection models');
      }
    };

    loadModels();
  }, []);

  // Start video stream
  useEffect(() => {
    if (isLoading || !videoRef.current) return;

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access denied:', err);
        setError('Camera access denied');
      }
    };

    startVideo();
  }, [isLoading]);

  // Detect face and landmarks
  useEffect(() => {
    if (isLoading || !videoRef.current || !canvasRef.current) return;

    let animationId: number;
    let isProcessing = false;
    
    const detectFace = async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4 || isProcessing) {
        animationId = requestAnimationFrame(detectFace);
        return;
      }

      isProcessing = true;

      try {
        // Detect single face with 68 landmarks
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.5
          }))
          .withFaceLandmarks();

        if (detection) {
          const points = detection.landmarks.positions;
          
          // Verify we have exactly 68 points
          if (points.length === 68) {
            const smoothedPoints = smoothLandmarks(points);
            setLandmarks(smoothedPoints);
            setFaceDetected(true);
          }
        } else {
          setLandmarks(null);
          setFaceDetected(false);
        }
      } catch (err) {
        console.error('Face detection error:', err);
      }

      isProcessing = false;
      animationId = requestAnimationFrame(detectFace);
    };

    const startDetection = () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        detectFace();
      }
    };

    if (videoRef.current) {
      videoRef.current.addEventListener('play', startDetection);
      if (videoRef.current.readyState === 4) {
        startDetection();
      }
    }

    return () => {
      cancelAnimationFrame(animationId);
      if (videoRef.current) {
        videoRef.current.removeEventListener('play', startDetection);
      }
    };
  }, [isLoading, smoothLandmarks]);

  return { 
    landmarks, 
    isLoading, 
    error, 
    videoRef, 
    canvasRef,
    faceDetected
  };
};

