import React, { useState } from 'react';
import VirtualMirror from './components/VirtualMirror';
import Controls from './components/Controls';
import { MakeupState, SkinAnalysisResult } from './types';
import { LIPSTICK_PALETTE, PRESET_LOOKS } from './constants';

const App: React.FC = () => {
  // Initial State: Load the "Natural Day" preset or a default blank slate
  const [makeupState, setMakeupState] = useState<MakeupState>(PRESET_LOOKS[0].config);
  
  const [skinAnalysis, setSkinAnalysis] = useState<SkinAnalysisResult | null>(null);
  const [triggerAnalysis, setTriggerAnalysis] = useState(false);

  const handleAnalysisComplete = () => {
    setTriggerAnalysis(false);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-black overflow-hidden relative">
      {/* Header - Minimalist */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start pointer-events-none">
        <div>
            <h1 className="text-2xl font-black text-white tracking-widest flex items-center gap-2 drop-shadow-lg">
            <span className="text-pink-500">✦</span> VIRTUAL GLOW
            </h1>
            <p className="text-gray-300 text-[10px] uppercase tracking-[0.2em] ml-8 opacity-80">Professional Studio</p>
        </div>
        
        {/* Skin Tone Badge */}
        {skinAnalysis && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-right pointer-events-auto">
                <div className="text-[9px] text-gray-400 uppercase tracking-widest">Detected Tone</div>
                <div className="text-xs font-bold text-pink-200 uppercase flex items-center gap-2">
                    {skinAnalysis.toneCategory} <span className="text-gray-500">•</span> {skinAnalysis.undertone}
                    <div className="w-3 h-3 rounded-full border border-white/30" style={{backgroundColor: skinAnalysis.dominantColor}}></div>
                </div>
            </div>
        )}
      </div>

      {/* Main Viewport */}
      <div className="absolute inset-0 z-0">
        <VirtualMirror
          makeupState={makeupState}
          onSkinAnalyzed={setSkinAnalysis}
          triggerAnalysis={triggerAnalysis}
          onAnalysisComplete={handleAnalysisComplete}
        />
      </div>

      {/* Controls Overlay */}
      <div className="absolute inset-0 z-30 pointer-events-none">
          <div className="pointer-events-auto h-full w-full">
            <Controls
                makeupState={makeupState}
                setMakeupState={setMakeupState}
                skinAnalysis={skinAnalysis}
                onAnalyzeSkin={() => setTriggerAnalysis(true)}
                isAnalyzing={triggerAnalysis}
            />
          </div>
      </div>
    </div>
  );
};

export default App;