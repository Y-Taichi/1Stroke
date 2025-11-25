
import React, { useMemo } from 'react';
import { AnalysisResult } from '../types';
import { pathToSvgD } from '../utils/geometry';

interface ResultVisualizerProps {
  result: AnalysisResult;
  morphValue?: number; // 0 (trace) to 100 (memory), defaults to 100 for static view
  showReference?: boolean;
}

const ResultVisualizer: React.FC<ResultVisualizerProps> = ({ 
  result, 
  morphValue = 100, 
  showReference = true
}) => {
  // Calculate the morphed path based on slider using RAW paths (1:1 scale)
  const displayedPath = useMemo(() => {
    // Use rawTrace and rawMemory for 1:1 visualization
    const trace = result.rawTrace;
    const memory = result.rawMemory;
    
    return memory.map((p, i) => ({
      // Interpolate between Memory (0) and Trace (100) - or Mine vs Target
      // UI shows "Mine"(0) to "Target"(100)
      // Mine = Memory path, Target = Trace path
      x: p.x + (trace[i].x - p.x) * (morphValue / 100),
      y: p.y + (trace[i].y - p.y) * (morphValue / 100),
    }));
  }, [result, morphValue]);

  const ColoredSegments = () => {
    // Heatmap coloring based on diffs
    return (
      <g>
        {displayedPath.map((p, i) => {
          if (i === 0) return null;
          const prev = displayedPath[i - 1];
          const d = result.diffs[i] || 0;
          
          // Visualization logic matches original:
          // Green (0) -> Yellow -> Red (High error)
          const intensity = Math.min(1, d / 15); 
          
          let r, g, b;
          if (intensity < 0.5) {
            // Green to Yellow
            r = Math.round(255 * (intensity * 2));
            g = 200;
            b = 0;
          } else {
            // Yellow to Red
            r = 255;
            g = Math.round(200 * (1 - (intensity - 0.5) * 2));
            b = 0;
          }
          
          const color = `rgb(${r}, ${g}, ${b})`;
          
          return (
            <line
              key={i}
              x1={prev.x}
              y1={prev.y}
              x2={p.x}
              y2={p.y}
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
            />
          );
        })}
      </g>
    );
  };

  // Reference ghost (Trace) - Raw coordinates
  const ReferencePath = () => (
    <path
      d={pathToSvgD(result.rawTrace)}
      fill="none"
      stroke="#94a3b8" 
      strokeWidth="2"
      strokeDasharray="5 5"
      className="opacity-40"
    />
  );

  return (
    <svg className="w-full h-full overflow-visible pointer-events-none">
      {showReference && <ReferencePath />}
      <ColoredSegments />
    </svg>
  );
};

export default ResultVisualizer;
