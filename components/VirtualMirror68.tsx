import React, { useEffect, useRef, useState } from 'react';
import { useFaceDetection68 } from '../hooks/useFaceDetection68';
import { MakeupRenderer68 } from '../utils/makeupRenderer68';
import { MakeupState, SkinAnalysisResult } from '../types';

interface VirtualMirror68Props {
  makeupState: MakeupState;
  onSkinAnalyzed: (result: SkinAnalysisResult) => void;
  showDebugLandmarks?: boolean;
}

const VirtualMirror68: React.FC<VirtualMirror68Props> = ({
  makeupState,
  onSkinAnalyzed,
  showDebugLandmarks = false
}) => {
  const { landmarks, isLoading, error, videoRef, canvasRef, faceDetected } = useFaceDetection68();
  const rendererRef = useRef<MakeupRenderer68 | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      canvasRef.current.width = 1280;
      canvasRef.current.height = 720;
      rendererRef.current = new MakeupRenderer68(canvasRef.current);
      console.log('✓ MakeupRenderer68 initialized');
    }
  }, [canvasRef]);

  // Render loop
  useEffect(() => {
    if (!rendererRef.current || !videoRef.current || !canvasRef.current) return;

    const render = () => {
      if (videoRef.current && videoRef.current.readyState === 4 && rendererRef.current) {
        // Set canvas size to match video
        const video = videoRef.current;
        if (canvasRef.current) {
          canvasRef.current.width = video.videoWidth || 1280;
          canvasRef.current.height = video.videoHeight || 720;
        }

        if (landmarks && landmarks.length === 68) {
          // Render makeup with 68-point landmarks
          rendererRef.current.render(video, landmarks, makeupState);
          
          // Draw debug landmarks if enabled
          if (showDebugLandmarks) {
            rendererRef.current.drawDebugLandmarks(landmarks);
          }
        } else {
          // No face detected - just show video
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(video, -canvasRef.current.width, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.restore();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [landmarks, makeupState, showDebugLandmarks, videoRef, canvasRef]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-gray-900 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-lg font-bold">Loading Face Detection...</p>
            <p className="text-sm text-gray-400 mt-2">68-point landmark model</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-gray-900 text-white">
          <div className="text-center p-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-xl font-bold mb-2">Camera Error</p>
            <p className="text-gray-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-pink-600 rounded-lg hover:bg-pink-500 transition"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Hidden video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
      />

      {/* Canvas for rendering */}
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain"
        style={{ transform: 'scaleX(1)' }} // Already mirrored in renderer
      />

      {/* Face Detection Status Indicator */}
      {!isLoading && !error && (
        <div className={`absolute top-4 left-4 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
          faceDetected
            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
            : 'bg-red-500/20 text-red-400 border border-red-500/50'
        }`}>
          {faceDetected ? '✓ Face Detected (68 points)' : '✗ No Face Detected'}
        </div>
      )}

      {/* Landmark Count (Debug) */}
      {showDebugLandmarks && landmarks && (
        <div className="absolute top-16 left-4 bg-black/80 text-green-400 px-3 py-2 rounded-lg text-xs font-mono">
          Landmarks: {landmarks.length}/68
        </div>
      )}
    </div>
  );
};

export default VirtualMirror68;

