import React, { useState, useRef, useEffect } from 'react';
import { LIPSTICK_PALETTE, EYESHADOW_PALETTE, EYELINER_PALETTE, BLUSH_PALETTE, HIGHLIGHTER_PALETTE, PRESET_LOOKS, SKIN_IMPRESSIONS_CONFIG } from '../constants';
import { MakeupState, MakeupCategory, SkinAnalysisResult, ColorShade, EyelinerStyle, PresetLook, FinishType, SkinImpressionMode } from '../types';

interface ControlsProps {
  makeupState: MakeupState;
  setMakeupState: React.Dispatch<React.SetStateAction<MakeupState>>;
  skinAnalysis: SkinAnalysisResult | null;
  onAnalyzeSkin: () => void;
  isAnalyzing: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  makeupState,
  setMakeupState,
  skinAnalysis,
  onAnalyzeSkin,
  isAnalyzing
}) => {
  const [activeTab, setActiveTab] = useState<MakeupCategory>('lips');
  const [isOpen, setIsOpen] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) && isOpen) {
        // Optional: Uncomment to enable click-outside-to-close
        // setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const updateLips = (updates: Partial<MakeupState['lips']>) => {
    setMakeupState(prev => ({ ...prev, lips: { ...prev.lips, ...updates } }));
  };
  const updateEyes = (updates: Partial<MakeupState['eyes']>) => {
    setMakeupState(prev => ({ ...prev, eyes: { ...prev.eyes, ...updates } }));
  };
  const updateFace = (updates: Partial<MakeupState['face']>) => {
    setMakeupState(prev => ({ ...prev, face: { ...prev.face, ...updates } }));
  };
  const updateSkin = (updates: Partial<MakeupState['skin']>) => {
    setMakeupState(prev => ({ ...prev, skin: { ...prev.skin, ...updates } }));
  };
  
  const applyPreset = (preset: PresetLook) => {
    setMakeupState(preset.config);
    // Visual feedback or optional close
  }

  // Common UI Components
  const ColorGrid = ({ palette, selected, onSelect, size = 'md' }: { palette: any[], selected: string, onSelect: (c: string) => void, size?: 'sm' | 'md' }) => (
    <div className={`grid ${size === 'md' ? 'grid-cols-6 md:grid-cols-8' : 'grid-cols-8 md:grid-cols-10'} gap-3 mt-2`}>
        {palette.map((shade) => (
        <button
            key={shade.name}
            onClick={() => onSelect(shade.color)}
            className="group flex flex-col items-center gap-1"
            title={shade.name}
        >
            <div 
            className={`rounded-full border-2 shadow-sm transition-all ${
                selected === shade.color 
                ? 'border-white scale-110 ring-2 ring-pink-500' 
                : 'border-white/10 opacity-70 group-hover:opacity-100'
            }`}
            style={{ 
                backgroundColor: shade.color,
                width: size === 'md' ? '2.5rem' : '2rem',
                height: size === 'md' ? '2.5rem' : '2rem'
            }}
            />
            <span className="text-[9px] text-gray-400 w-full truncate text-center hidden md:block">{shade.name}</span>
        </button>
        ))}
    </div>
  );

  const Slider = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
      <div className="w-full">
        <div className="flex justify-between mb-1">
            <label className="text-xs text-gray-400 uppercase tracking-wider">{label}</label>
            <span className="text-xs text-gray-500">{(value * 100).toFixed(0)}%</span>
        </div>
        <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
        />
      </div>
  );

  if (!isOpen) {
      return (
          <button 
            onClick={() => setIsOpen(true)}
            className="absolute bottom-6 right-6 bg-pink-600 text-white p-4 rounded-full shadow-lg hover:bg-pink-500 transition-all z-50 animate-bounce"
          >
              <span className="text-2xl">✨</span>
          </button>
      );
  }

  return (
    <div ref={panelRef} className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.8)] border-t border-white/10 max-h-[60vh] flex flex-col z-40 transition-transform duration-300">
      
      {/* Top Bar: Tabs & Close */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-white/5 rounded-t-3xl">
         <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth">
            {(['lips', 'eyes', 'face', 'looks'] as MakeupCategory[]).map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                        activeTab === tab 
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg transform scale-105' 
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    {tab}
                </button>
            ))}
         </div>
         
         <div className="flex items-center gap-3 pl-4 border-l border-white/10 ml-2">
            <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
            >
                ✕
            </button>
         </div>
      </div>

      {/* Content Area */}
      <div className="p-6 overflow-y-auto custom-scrollbar">
        
        {/* LIPS TAB */}
        {activeTab === 'lips' && (
            <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-1/3 space-y-6">
                        <Slider label="Lipstick Intensity" value={makeupState.lips.opacity} onChange={(v) => updateLips({ opacity: v })} />
                        <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Finish</label>
                            <div className="flex bg-gray-800 rounded-lg p-1">
                                {(['matte', 'satin', 'gloss'] as FinishType[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => updateLips({ finish: f })}
                                    className={`flex-1 py-2 rounded-md text-xs font-bold uppercase transition-all ${
                                    makeupState.lips.finish === f ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {f}
                                </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-2/3">
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-3">Shades</label>
                        <ColorGrid 
                            palette={LIPSTICK_PALETTE} 
                            selected={makeupState.lips.color} 
                            onSelect={(c) => updateLips({ color: c })} 
                        />
                    </div>
                </div>
            </div>
        )}

        {/* EYES TAB */}
        {activeTab === 'eyes' && (
            <div className="space-y-8 animate-fadeIn">
                {/* Eyeshadow */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-pink-200">EYESHADOW</h3>
                        <div className="w-32">
                           <Slider label="" value={makeupState.eyes.shadowOpacity} onChange={(v) => updateEyes({ shadowOpacity: v })} />
                        </div>
                    </div>
                    <ColorGrid palette={EYESHADOW_PALETTE} selected={makeupState.eyes.shadowColor} onSelect={(c) => updateEyes({ shadowColor: c })} size="sm" />
                </div>

                {/* Eyeliner */}
                <div className="pt-6 border-t border-white/10">
                    <div className="flex flex-col md:flex-row gap-8 mt-2">
                         <div className="w-full md:w-1/3 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-pink-200">EYELINER</h3>
                                <div className="w-24"><Slider label="" value={makeupState.eyes.linerOpacity} onChange={(v) => updateEyes({ linerOpacity: v })} /></div>
                            </div>
                            
                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Style</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['natural', 'classic', 'winged', 'smoky'] as EyelinerStyle[]).map(style => (
                                        <button 
                                            key={style}
                                            onClick={() => updateEyes({ linerStyle: style })}
                                            className={`py-2 px-3 rounded-lg text-xs font-bold uppercase border transition-all ${
                                                makeupState.eyes.linerStyle === style
                                                ? 'bg-pink-900/50 border-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                                                : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'
                                            }`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>
                         </div>
                         <div className="w-full md:w-2/3">
                             <label className="text-xs text-gray-400 uppercase tracking-wider block mb-3">Liner Color</label>
                             <ColorGrid palette={EYELINER_PALETTE} selected={makeupState.eyes.linerColor} onSelect={(c) => updateEyes({ linerColor: c })} size="md" />
                         </div>
                    </div>
                </div>
            </div>
        )}

        {/* FACE TAB */}
        {activeTab === 'face' && (
            <div className="space-y-8 animate-fadeIn">
                
                {/* Skin Impression Section */}
                <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-pink-200 flex items-center gap-2">
                            ✨ SKIN IMPRESSION
                        </h3>
                         <div className="w-32">
                             <Slider label="Smoothing" value={makeupState.skin.smoothing} onChange={(v) => updateSkin({ smoothing: v })} />
                         </div>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-2">
                        {(Object.keys(SKIN_IMPRESSIONS_CONFIG) as SkinImpressionMode[]).map(mode => (
                             <button
                                key={mode}
                                onClick={() => updateSkin({ impression: mode })}
                                className={`py-2 px-2 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all ${
                                    makeupState.skin.impression === mode 
                                    ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105 transform'
                                    : 'bg-black/40 text-gray-400 hover:bg-black/60 border border-transparent hover:border-white/10'
                                }`}
                             >
                                 {SKIN_IMPRESSIONS_CONFIG[mode].name}
                             </button>
                        ))}
                    </div>
                </div>

                {/* Blush */}
                <div className="flex flex-col md:flex-row gap-6">
                     <div className="w-full md:w-1/3">
                        <h3 className="text-sm font-bold text-pink-200 mb-4">BLUSH</h3>
                        <Slider label="Intensity" value={makeupState.face.blushOpacity} onChange={(v) => updateFace({ blushOpacity: v })} />
                     </div>
                     <div className="w-full md:w-2/3">
                        <ColorGrid palette={BLUSH_PALETTE} selected={makeupState.face.blushColor} onSelect={(c) => updateFace({ blushColor: c })} />
                     </div>
                </div>

                {/* Highlighter */}
                <div className="flex flex-col md:flex-row gap-6 pt-6 border-t border-white/10">
                     <div className="w-full md:w-1/3">
                        <h3 className="text-sm font-bold text-pink-200 mb-4">HIGHLIGHTER</h3>
                        <Slider label="Glow" value={makeupState.face.highlighterOpacity} onChange={(v) => updateFace({ highlighterOpacity: v })} />
                     </div>
                     <div className="w-full md:w-2/3">
                        <ColorGrid palette={HIGHLIGHTER_PALETTE} selected={makeupState.face.highlighterColor} onSelect={(c) => updateFace({ highlighterColor: c })} />
                     </div>
                </div>
            </div>
        )}

        {/* LOOKS TAB */}
        {activeTab === 'looks' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
                 {PRESET_LOOKS.map(look => (
                     <button
                        key={look.name}
                        onClick={() => applyPreset(look)}
                        className="group relative overflow-hidden rounded-xl bg-gray-800 hover:bg-gray-700 transition-all text-left p-5 border border-white/5 hover:border-pink-500/50 hover:shadow-[0_0_20px_rgba(236,72,153,0.15)]"
                     >
                         <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity text-2xl">
                            ✦
                         </div>
                         <h3 className="text-lg font-bold text-white mb-1 group-hover:text-pink-200 transition-colors">{look.name}</h3>
                         <p className="text-xs text-gray-400 mb-4">{look.description}</p>
                         <div className="flex gap-2 items-center">
                             <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full border-2 border-gray-800" style={{backgroundColor: look.config.lips.color}} title="Lip" />
                                <div className="w-6 h-6 rounded-full border-2 border-gray-800" style={{backgroundColor: look.config.eyes.shadowColor}} title="Eye" />
                                <div className="w-6 h-6 rounded-full border-2 border-gray-800" style={{backgroundColor: look.config.face.blushColor}} title="Blush" />
                             </div>
                             <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider ml-2">Apply Look</span>
                         </div>
                     </button>
                 ))}
             </div>
        )}

      </div>
    </div>
  );
};

export default Controls;