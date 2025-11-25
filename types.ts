
export interface Point {
  x: number;
  y: number;
}

export type Path = Point[];

export enum AppStep {
  UPLOAD = 'UPLOAD',
  TRACE = 'TRACE',
  MEMORY = 'MEMORY',
  RESULT = 'RESULT',
}

export interface AnalysisResult {
  score: number;
  diffs: number[]; // Distance per point index
  normalizedTrace: Path;
  normalizedMemory: Path;
  rawTrace: Path;
  rawMemory: Path;
  isHintUsed?: boolean;
}
