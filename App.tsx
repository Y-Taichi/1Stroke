
import React, { useState, useEffect } from 'react';
import { useI18n } from './i18n';
import DrawingCanvas from './components/DrawingCanvas';
import ResultAnalysis from './components/ResultAnalysis';
import ResultVisualizer from './components/ResultVisualizer';
import { AppStep, Path, AnalysisResult } from './types';
import { analyzePaths } from './utils/geometry';

const STORAGE_KEY_RESULT = 'osm_last_result';
const STORAGE_KEY_IMAGE = 'osm_ref_image';
const STORAGE_KEY_TRACE = 'osm_trace_path';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [tracePath, setTracePath] = useState<Path>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [savedResult, setSavedResult] = useState<AnalysisResult | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const { locale, setLocale, t } = useI18n();

  // Apply dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load saved state on mount
  useEffect(() => {
    const savedRes = localStorage.getItem(STORAGE_KEY_RESULT);
    if (savedRes) {
      try {
        setSavedResult(JSON.parse(savedRes));
      } catch (e) {
        console.error("Failed to parse saved result", e);
      }
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          const imgData = evt.target.result as string;
          setReferenceImage(imgData);
          localStorage.setItem(STORAGE_KEY_IMAGE, imgData);
          setStep(AppStep.TRACE);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTraceComplete = (path: Path) => {
    setTracePath(path);
    localStorage.setItem(STORAGE_KEY_TRACE, JSON.stringify(path));
    setTimeout(() => {
      setStep(AppStep.MEMORY);
    }, 300);
  };

  const handleMemoryComplete = (path: Path, isHintUsed: boolean) => {
    const result = analyzePaths(tracePath, path);
    result.isHintUsed = isHintUsed;
    setAnalysisResult(result);
    setSavedResult(result);
    localStorage.setItem(STORAGE_KEY_RESULT, JSON.stringify(result));
    setStep(AppStep.RESULT);
  };

  const handleRetry = () => {
    setStep(AppStep.MEMORY);
  };

  const handleNewImage = () => {
    setReferenceImage(null);
    setTracePath([]);
    setAnalysisResult(null);
    setStep(AppStep.UPLOAD);
  };

  const handleResume = () => {
    if (savedResult) {
      setAnalysisResult(savedResult);
      const img = localStorage.getItem(STORAGE_KEY_IMAGE);
      const trace = localStorage.getItem(STORAGE_KEY_TRACE);
      if (img) setReferenceImage(img);
      if (trace) setTracePath(JSON.parse(trace));
      setStep(AppStep.RESULT);
    }
  };

  const startPoint = tracePath.length > 0 ? tracePath[0] : undefined;
  const endPoint = tracePath.length > 0 ? tracePath[tracePath.length - 1] : undefined;

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans relative transition-colors duration-300">
      
      {/* Dark Mode Toggle */}
      <div className="fixed top-6 right-6 z-50 flex gap-3 items-center">
        <div className="rounded-full bg-white/80 dark:bg-slate-800/80 p-1 shadow-md border border-slate-200 dark:border-slate-700">
          <button className={`px-3 py-1 rounded-full ${locale === 'en' ? 'bg-slate-900 text-white' : ''}`} onClick={() => setLocale('en')}>EN</button>
          <button className={`px-3 py-1 rounded-full ${locale === 'ja' ? 'bg-slate-900 text-white' : ''}`} onClick={() => setLocale('ja')}>日本語</button>
        </div>

        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="z-50 p-3 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-md border border-slate-200 dark:border-slate-700 transition hover:scale-110"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Background Layer for Start Screen - Previous Result Visualization */}
      {step === AppStep.UPLOAD && savedResult && (
        <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10 pointer-events-none flex items-center justify-center overflow-hidden">
           <div className="w-full h-full scale-125 origin-center">
             <ResultVisualizer result={savedResult} showReference={false} />
           </div>
        </div>
      )}

      {step === AppStep.UPLOAD && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="w-full max-w-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center border border-white/50 dark:border-slate-700">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg text-white">
              ✍️
            </div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">{t('app.title')}</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">{t('app.subtitle')}</p>
            
            <div className="space-y-4">
              <label className="block w-full group cursor-pointer relative">
                <span className="sr-only">{t('file.choose')}</span>
                <div className="w-full py-4 px-6 bg-slate-900 dark:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-slate-300 dark:shadow-none transition group-hover:scale-[1.02] group-active:scale-95 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  {t('button.newDrawing')}
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {savedResult && (
                <button 
                  onClick={handleResume}
                  className="w-full py-4 px-6 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md transition hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-95 flex items-center justify-center gap-2"
                >
                  {t('button.resume')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {step === AppStep.TRACE && referenceImage && (
        <DrawingCanvas
          backgroundImage={referenceImage}
          onComplete={handleTraceComplete}
          hideBackground={false}
        />
      )}

      {step === AppStep.MEMORY && (
        <DrawingCanvas
          backgroundImage={referenceImage || undefined}
          hideBackground={true}
          onComplete={handleMemoryComplete}
          guideStart={startPoint}
          guideEnd={endPoint}
          showColorPicker={true}
          tracePath={tracePath}
        />
      )}

      {step === AppStep.RESULT && analysisResult && (
        <ResultAnalysis
          result={analysisResult}
          onRetry={handleRetry}
          onNewImage={handleNewImage}
        />
      )}
    </div>
  );
};

export default App;
