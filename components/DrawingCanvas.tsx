
import React, { useRef, useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { Path, Point } from '../types';
import { pathToSvgD } from '../utils/geometry';

interface DrawingCanvasProps {
  backgroundImage?: string;
  onComplete: (path: Path, isHintUsed: boolean) => void;
  hideBackground?: boolean;
  guideStart?: Point;
  guideEnd?: Point;
  showColorPicker?: boolean;
  tracePath?: Path;
}

const COLORS = [
  '#2563eb', // Blue (Default)
  '#ef4444', // Red
  '#22c55e', // Green
  '#eab308', // Yellow
  '#a855f7', // Purple
  '#f97316', // Orange
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#64748b', // Slate
];

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ 
  backgroundImage, 
  onComplete, 
  hideBackground,
  guideStart,
  guideEnd,
  showColorPicker = false,
  tracePath
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentPath, setCurrentPath] = useState<Path>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState(COLORS[0]);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  
  // Hint Mode State
  const [isHintMode, setIsHintMode] = useState(false);
  const [cursorPos, setCursorPos] = useState<Point>({ x: -1000, y: -1000 });

  const getCoordinates = (e: React.PointerEvent<SVGSVGElement> | PointerEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d
    };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const point = getCoordinates(e);
    setCurrentPath([point]);
    setCursorPos(point);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const point = getCoordinates(e);
    setCursorPos(point); // Always update cursor for hint mask
    
    if (!isDrawing) return;
    setCurrentPath(prev => [...prev, point]);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDrawing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleReset = () => {
    setCurrentPath([]);
  };

  const toggleHintMode = () => {
    setIsHintMode(prev => !prev);
    // Reset the drawing when toggling mode as per requirements
    handleReset();
  };

  const { t } = useI18n();

  const handleFinish = () => {
    if (currentPath.length > 5) {
      onComplete(currentPath, isHintMode);
    } else {
      alert(t('alert.drawLonger'));
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-50 dark:bg-slate-900 overflow-hidden touch-none select-none">
      
      {/* Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          color: 'var(--grid-color, #64748b)'
        }}
      />

      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full touch-none cursor-crosshair z-0"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setCursorPos({ x: -1000, y: -1000 })}
      >
        <defs>
          <mask id="hintMask">
            {/* White reveals everything */}
            <rect x="-10000" y="-10000" width="20000" height="20000" fill="white" />
            {/* Black circle hides the reference near the cursor */}
            <circle cx={cursorPos.x} cy={cursorPos.y} r="60" fill="black" />
          </mask>
        </defs>

        {/* Background Image Layer - Always visible if !hideBackground (Trace Mode), hidden in Memory Mode unless changed logic (Here we keep it strictly hidden in memory mode) */}
        {backgroundImage && (
          <image 
            href={backgroundImage} 
            width="100%" 
            height="100%" 
            preserveAspectRatio="xMidYMid meet"
            className="pointer-events-none"
            style={{ 
              opacity: (!hideBackground) ? 0.4 : 0,
              transition: 'opacity 0.3s ease'
            }}
          />
        )}

        {/* HINT LAYER: Trace Path (Answer Line) - Only in Memory Mode when Hint is ON */}
        {hideBackground && isHintMode && tracePath && tracePath.length > 0 && (
          <path
            d={pathToSvgD(tracePath)}
            fill="none"
            stroke="#10b981" // Emerald color for the answer
            strokeWidth="3"
            strokeDasharray="8 6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none"
            style={{ 
              mask: 'url(#hintMask)',
              opacity: 0.6
            }}
          />
        )}

        {/* Guides for Memory Mode */}
        {guideStart && (
          <g className="pointer-events-none">
            <circle cx={guideStart.x} cy={guideStart.y} r={12} fill="rgba(16, 185, 129, 0.2)" className="animate-pulse" />
            <circle cx={guideStart.x} cy={guideStart.y} r={4} fill="#10b981" />
            <text x={guideStart.x + 15} y={guideStart.y + 5} className="text-sm fill-emerald-600 dark:fill-emerald-400 font-bold font-sans shadow-sm" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.1)' }}>{t('start')}</text>
          </g>
        )}
        
        {guideEnd && (
          <g className="pointer-events-none opacity-60">
            <circle cx={guideEnd.x} cy={guideEnd.y} r={4} stroke="#ef4444" strokeWidth={2} fill="none" />
            <text x={guideEnd.x + 15} y={guideEnd.y + 5} className="text-sm fill-red-500 dark:fill-red-400 font-bold font-sans" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.1)' }}>{t('end')}</text>
          </g>
        )}

        {/* Current drawing path */}
        <path
          d={pathToSvgD(currentPath)}
          fill="none"
          stroke={penColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none drop-shadow-sm"
        />
      </svg>

      {/* Bottom Controls - Right Aligned */}
      <div className="absolute bottom-6 right-6 flex items-end gap-3 z-20">
        
        {/* Hint Toggle (Only in Memory Mode i.e. when guideStart exists or hideBackground is true) */}
        {hideBackground && (
          <button
            onClick={toggleHintMode}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 shadow-lg transition active:scale-95 ${
              isHintMode 
                ? 'bg-yellow-400 border-yellow-500 text-yellow-900 shadow-yellow-500/50' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400'
            }`}
            title={t('hint.toggle')}
          >
            <span className="text-lg">💡</span>
          </button>
        )}

        {/* Color Picker */}
        {showColorPicker && (
          <div className="relative">
            {isColorPickerOpen && (
              <div className="absolute bottom-full right-0 mb-3 bg-white dark:bg-slate-800 p-2 rounded-full shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-2 animate-in slide-in-from-bottom-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      setPenColor(color);
                      setIsColorPickerOpen(false);
                    }}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-600 shadow-sm hover:scale-110 transition"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
            <button
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              className="w-12 h-12 rounded-full shadow-lg border-2 border-white dark:border-slate-600 flex items-center justify-center transition active:scale-95"
              style={{ backgroundColor: penColor }}
            >
              <div className="w-3 h-3 bg-white rounded-full opacity-50" />
            </button>
          </div>
        )}

        <button
          onClick={handleReset}
          className="px-5 py-3 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-lg border border-slate-200 dark:border-slate-700 active:scale-95 text-sm"
        >
          {t('button.clear')}
        </button>
        
        <button
          onClick={handleFinish}
          disabled={currentPath.length < 5}
          className={`px-6 py-3 rounded-full font-bold text-white transition shadow-lg transform active:scale-95 text-sm ${
            currentPath.length < 5 
              ? 'bg-slate-400 cursor-not-allowed' 
              : 'bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500'
          }`}
          >
          {t('button.done')}
        </button>
      </div>
    </div>
  );
};

export default DrawingCanvas;
