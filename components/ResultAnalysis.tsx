
import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResult } from '../types';
import { useI18n } from '../i18n';
import { getDrawingAdvice } from '../services/geminiService';
import ResultVisualizer from './ResultVisualizer';

interface ResultAnalysisProps {
  result: AnalysisResult;
  onRetry: () => void;
  onNewImage: () => void;
}

const ResultAnalysis: React.FC<ResultAnalysisProps> = ({ result, onRetry, onNewImage }) => {
  const [morphValue, setMorphValue] = useState(0); // 0 (Mine) to 100 (Target)
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Zoom and Pan State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastDist = useRef<number | null>(null);

  const { t, locale } = useI18n();

  const fetchAdvice = async () => {
    if (advice) return;
    setLoadingAdvice(true);
    const text = await getDrawingAdvice(result.score, result.diffs, locale);
    setAdvice(text);
    setLoadingAdvice(false);
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.5, scale + scaleAmount), 5);
    setScale(newScale);
  };

  // Pointer Events for Panning
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    
    const deltaX = e.clientX - lastPos.current.x;
    const deltaY = e.clientY - lastPos.current.y;
    
    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Touch Pinch Zoom (basic implementation)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastDist.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist - lastDist.current;
      const newScale = Math.min(Math.max(0.5, scale + delta * 0.01), 5);
      setScale(newScale);
      lastDist.current = dist;
    }
  };

  

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 flex flex-col animate-in fade-in duration-300">
      
      {/* Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          color: 'var(--grid-color, #64748b)'
        }}
      />

      {/* Main Visualization Area - Full Screen, Zoomable */}
      <div 
        ref={containerRef}
        className="flex-1 relative w-full h-full overflow-hidden touch-none cursor-move"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
         <div 
            className="w-full h-full transition-transform duration-75 ease-out origin-center"
            style={{
               transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`
            }}
         >
           <ResultVisualizer 
              result={result} 
              morphValue={morphValue} 
              showReference={true}
           />
         </div>
         
         {/* Floating Advice Overlay */}
         {advice && (
            <div className="absolute top-24 left-6 right-6 md:left-auto md:right-6 md:w-80 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-indigo-100 dark:border-slate-700 animate-in slide-in-from-top-4 z-20 pointer-events-auto cursor-auto" onPointerDown={e => e.stopPropagation()}>
               <h4 className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1">{t('ai.coach')}</h4>
               <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{advice}</p>
               <button onClick={() => setAdvice(null)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">×</button>
            </div>
         )}

         {/* Zoom Controls Overlay (Optional but helpful) */}
         <div className="absolute top-4 left-4 flex flex-col gap-2 z-20 pointer-events-none">
            <div className="bg-black/30 backdrop-blur text-white text-xs px-2 py-1 rounded pointer-events-auto">
               {t('zoom')}: {Math.round(scale * 100)}%
            </div>
            {result.isHintUsed && (
               <div className="bg-yellow-500/90 text-white dark:text-slate-900 font-bold text-xs px-2 py-1 rounded pointer-events-auto shadow-sm flex items-center gap-1">
                 💡 {t('hint.used')}
               </div>
            )}
         </div>
      </div>

      {/* Bottom Bar Controls */}
      <div className="flex-none bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-6 py-6 pb-safe-offset flex flex-col md:flex-row items-center gap-6 z-50">
        
        {/* Left: Slider */}
        <div className="w-full md:w-1/3 flex items-center gap-3">
           <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase w-12">{t('label.mine')}</span>
           <input 
            type="range" 
            min="0" 
            max="100" 
            value={morphValue} 
            onChange={(e) => setMorphValue(Number(e.target.value))}
            className="flex-1 accent-blue-600 h-2 bg-slate-100 dark:bg-slate-700 rounded-full appearance-none cursor-pointer border border-slate-200 dark:border-slate-600"
          />
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase w-12 text-right">{t('label.target')}</span>
        </div>

        {/* Center: Score */}
        <div className="flex flex-col items-center md:w-1/3">
          <div className="flex items-baseline gap-1 justify-center">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-2">{t('label.match')}</span>
            <span className={`text-4xl font-black ${result.score > 80 ? 'text-green-500' : result.score > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
              {result.score.toFixed(1)}
            </span>
            <span className="text-xl font-bold text-slate-400 dark:text-slate-600">%</span>
          </div>
          {result.isHintUsed && (
            <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mt-1">
              {t('withHint')}
            </span>
          )}
        </div>

        {/* Right: Buttons */}
        <div className="w-full md:w-1/3 flex justify-end gap-3">
          {!advice && (
             <button 
               onClick={fetchAdvice}
               disabled={loadingAdvice}
               className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition active:scale-95"
               title={t('getAdvice')}
             >
               {loadingAdvice ? <span className="animate-spin block">↻</span> : "✨"}
             </button>
          )}
          
          <button 
            onClick={onRetry}
            className="flex-1 md:flex-none px-6 py-3 rounded-full bg-slate-800 dark:bg-blue-600 text-white font-bold hover:bg-slate-900 dark:hover:bg-blue-500 shadow-lg shadow-slate-200 dark:shadow-none transition active:scale-95 whitespace-nowrap"
          >
            {t('button.tryAgain')}
          </button>
          <button 
            onClick={onNewImage}
            className="flex-1 md:flex-none px-6 py-3 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition active:scale-95 whitespace-nowrap"
          >
            {t('button.newImage')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultAnalysis;
