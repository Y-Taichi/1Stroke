
import { Point, Path, AnalysisResult } from '../types';

// Calculate distance between two points
export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// Calculate total length of a path
export const getPathLength = (path: Path): number => {
  let len = 0;
  for (let i = 1; i < path.length; i++) {
    len += distance(path[i - 1], path[i]);
  }
  return len;
};

// Resample a path to have exactly N equidistant points
export const resamplePath = (path: Path, numPoints: number): Path => {
  if (path.length < 2) return path;
  
  const totalLength = getPathLength(path);
  const interval = totalLength / (numPoints - 1);
  const newPath: Path = [path[0]];
  
  let currentDist = 0;
  let nextIndex = 1;
  let lastPoint = path[0];
  
  for (let i = 1; i < numPoints; i++) {
    const targetDist = i * interval;
    
    // Find the segment that contains the target distance
    let distToNext = distance(lastPoint, path[nextIndex]);
    while (currentDist + distToNext < targetDist && nextIndex < path.length - 1) {
      currentDist += distToNext;
      lastPoint = path[nextIndex];
      nextIndex++;
      distToNext = distance(lastPoint, path[nextIndex]);
    }
    
    const remainingDist = targetDist - currentDist;
    const t = remainingDist / distToNext;
    
    // Interpolate
    const x = lastPoint.x + (path[nextIndex].x - lastPoint.x) * t;
    const y = lastPoint.y + (path[nextIndex].y - lastPoint.y) * t;
    newPath.push({ x, y });
  }
  
  // Ensure the last point is exact
  if (newPath.length < numPoints) {
    newPath.push(path[path.length - 1]);
  }
  
  return newPath;
};

// Get Bounding Box
const getBounds = (path: Path) => {
  const xs = path.map(p => p.x);
  const ys = path.map(p => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
};

// Normalize path: Move centroid to (0,0) and Scale to fit 100x100 box (preserving aspect)
export const normalizePath = (path: Path): Path => {
  if (path.length === 0) return [];

  const bounds = getBounds(path);
  const centerX = bounds.minX + bounds.width / 2;
  const centerY = bounds.minY + bounds.height / 2;
  
  // Scale factor to fit within 100 units
  const scale = 100 / Math.max(bounds.width, bounds.height, 1); // Avoid div by zero

  return path.map(p => ({
    x: (p.x - centerX) * scale,
    y: (p.y - centerY) * scale
  }));
};

// Compare two paths
export const analyzePaths = (trace: Path, memory: Path): AnalysisResult => {
  const SAMPLES = 100;
  
  // 1. Resample both to same point count (preserving original coordinate space)
  const resampledTrace = resamplePath(trace, SAMPLES);
  const resampledMemory = resamplePath(memory, SAMPLES);
  
  // 2. Normalize both (scale and center) for SCORING calculation only
  const normTrace = normalizePath(resampledTrace);
  const normMemory = normalizePath(resampledMemory);
  
  // 3. Calculate distances per point on normalized paths
  const diffs: number[] = [];
  let totalDiff = 0;
  
  for (let i = 0; i < SAMPLES; i++) {
    const d = distance(normTrace[i], normMemory[i]);
    diffs.push(d);
    totalDiff += d;
  }
  
  // 4. Calculate Score (0-100) based on average distance
  const avgDiff = totalDiff / SAMPLES;
  const score = Math.max(0, 100 - (avgDiff * 2.5)); 

  return {
    score,
    diffs,
    normalizedTrace: normTrace,
    normalizedMemory: normMemory,
    rawTrace: resampledTrace,
    rawMemory: resampledMemory,
  };
};

// Convert a Path array to SVG Path string 'M x y L x y ...'
export const pathToSvgD = (path: Path, offsetX: number = 0, offsetY: number = 0, scale: number = 1): string => {
  if (path.length === 0) return '';
  const d = path.map((p, i) => {
    const cmd = i === 0 ? 'M' : 'L';
    return `${cmd} ${p.x * scale + offsetX} ${p.y * scale + offsetY}`;
  }).join(' ');
  return d;
};
