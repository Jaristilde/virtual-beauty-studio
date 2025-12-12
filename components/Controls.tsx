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

  // Close panel when clicking outside (FIXED)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };
    
    // Small delay to prevent immediate close on open
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
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
    // Auto-close panel after selection with smooth transition
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
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
    <div ref={panelRef} className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.8)] border-t border-white/10 max-h-[60vh] md:max-h-[70vh] flex flex-col z-40 transition-transform duration-300 controls-panel-mobile">
      
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

        {/* LOOKS TAB - WITH PREVIEW THUMBNAILS */}
        {activeTab === 'looks' && (
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 animate-fadeIn">
                 {PRESET_LOOKS.map(look => {
                     const isSelected = 
                       makeupState.lips.color === look.config.lips.color &&
                       makeupState.eyes.shadowColor === look.config.eyes.shadowColor;
                     
                     return (
                       <button
                          key={look.name}
                          onClick={() => applyPreset(look)}
                          className={`look-card ${isSelected ? 'look-card-selected' : ''} group text-left`}
                       >
                           {/* Preview Area - Face Icon with Makeup Colors */}
                           <div className="look-preview">
                              <div className="look-preview-placeholder">
                                {/* Stylized Face SVG with makeup colors */}
                                <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  {/* Face Shape */}
                                  <ellipse cx="50" cy="50" rx="30" ry="35" fill="#2a2a2a" stroke="#444" strokeWidth="1.5"/>
                                  
                                  {/* Eyes with Shadow */}
                                  <ellipse cx="40" cy="42" rx="6" ry="8" fill={look.config.eyes.shadowColor} opacity="0.6"/>
                                  <ellipse cx="60" cy="42" rx="6" ry="8" fill={look.config.eyes.shadowColor} opacity="0.6"/>
                                  <circle cx="40" cy="44" r="2.5" fill="#1a1a1a"/>
                                  <circle cx="60" cy="44" r="2.5" fill="#1a1a1a"/>
                                  <circle cx="40.5" cy="43.5" r="0.8" fill="#666"/>
                                  <circle cx="60.5" cy="43.5" r="0.8" fill="#666"/>
                                  
                                  {/* Eyeliner */}
                                  {look.config.eyes.linerOpacity > 0 && (
                                    <>
                                      <path d="M 34 42 Q 40 40 46 42" stroke={look.config.eyes.linerColor} strokeWidth="1.5" strokeLinecap="round" opacity={look.config.eyes.linerOpacity}/>
                                      <path d="M 54 42 Q 60 40 66 42" stroke={look.config.eyes.linerColor} strokeWidth="1.5" strokeLinecap="round" opacity={look.config.eyes.linerOpacity}/>
                                    </>
                                  )}
                                  
                                  {/* Blush */}
                                  <ellipse cx="32" cy="55" rx="6" ry="4" fill={look.config.face.blushColor} opacity="0.5"/>
                                  <ellipse cx="68" cy="55" rx="6" ry="4" fill={look.config.face.blushColor} opacity="0.5"/>
                                  
                                  {/* Highlighter Glow */}
                                  {look.config.face.highlighterOpacity > 0 && (
                                    <>
                                      <circle cx="50" cy="38" r="3" fill={look.config.face.highlighterColor} opacity="0.4"/>
                                      <ellipse cx="35" cy="52" rx="4" ry="2" fill={look.config.face.highlighterColor} opacity="0.3"/>
                                      <ellipse cx="65" cy="52" rx="4" ry="2" fill={look.config.face.highlighterColor} opacity="0.3"/>
                                    </>
                                  )}
                                  
                                  {/* Lips */}
                                  <path 
                                    d="M 40 65 Q 45 63 50 63 Q 55 63 60 65 Q 55 70 50 70 Q 45 70 40 65 Z" 
                                    fill={look.config.lips.color} 
                                    opacity={look.config.lips.opacity}
                                    stroke={look.config.lips.color}
                                    strokeWidth="0.5"
                                  />
                                  {/* Lip Gloss Effect */}
                                  {look.config.lips.finish === 'gloss' && (
                                    <ellipse cx="50" cy="67" rx="4" ry="1.5" fill="white" opacity="0.4"/>
                                  )}
                                </svg>
                              </div>
                              
                              {/* Color indicator dots */}
                              <div className="look-colors">
                                <span 
                                  className="look-color-dot" 
                                  style={{ backgroundColor: look.config.lips.color }}
                                  title="Lips"
                                />
                                <span 
                                  className="look-color-dot" 
                                  style={{ backgroundColor: look.config.eyes.shadowColor }}
                                  title="Eyes"
                                />
                                <span 
                                  className="look-color-dot" 
                                  style={{ backgroundColor: look.config.face.blushColor }}
                                  title="Blush"
                                />
                              </div>
                           </div>
                           
                           {/* Look Info */}
                           <div className="look-info">
                              <div className="look-name">{look.name}</div>
                              <div className="look-description">{look.description}</div>
                           </div>
                           
                           {/* Selection indicator */}
                           {isSelected && (
                             <div className="absolute top-2 right-2 bg-pink-500 text-white rounded-full p-1">
                               <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                 <path d="M13.5 4L6 11.5L2.5 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                               </svg>
                             </div>
                           )}
                       </button>
                     );
                 })}
             </div>
        )}

      </div>
    </div>
  );
};

export default Controls;