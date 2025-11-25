import React, { createContext, useContext, useEffect, useState } from 'react';

export type Locale = 'en' | 'ja';

const DEFAULT: Locale = (typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('ja')) ? 'ja' : 'en';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    'app.title': 'OneStroke Master',
    'app.subtitle': 'Trace, memorize, and perfect your stroke.',
    'file.choose': 'Choose file',
    'button.newDrawing': 'New Drawing',
    'button.resume': 'Resume Previous',
    'start': 'Start',
    'end': 'End',
    'alert.drawLonger': 'Please draw a longer line first.',
    'hint.toggle': 'Toggle Hint Mode (Resets Drawing)',
    'ai.coach': 'AI Coach',
    'label.mine': 'Mine',
    'label.target': 'Target',
    'label.match': 'Match',
    'getAdvice': 'Get AI Advice',
      'zoom': 'Zoom',
      'hint.used': 'Hint Mode Used',
      'withHint': '(With Hint)',
      'button.tryAgain': 'Try Again',
      'button.newImage': 'New Image',
    'button.clear': 'Clear',
    'button.done': 'Done',
    'keepPracticing': 'Keep practicing! Focus on the flow of the line.',
    'api.key.missing': "API Key not found",
    'api.key.not-configured': "API Key not configured. Can't fetch AI advice.",
    'api.unavailable': 'Could not connect to the AI teacher at the moment.'
  },
  ja: {
    'app.title': '一筆描きマスター',
    'app.subtitle': 'トレース、記憶、そして一筆の精度を磨く。',
    'file.choose': 'ファイルを選択',
    'button.newDrawing': '新しい描画',
    'button.resume': '前回を再開',
    'start': '開始',
    'end': '終了',
    'alert.drawLonger': 'まず長めの線を描いてください。',
    'hint.toggle': 'ヒントモードの切り替え（描画をリセット）',
    'ai.coach': 'AIコーチ',
    'label.mine': '自分の線',
    'label.target': '目標',
    'label.match': '一致度',
    'getAdvice': 'AIアドバイスを取得',
    'zoom': 'ズーム',
    'hint.used': 'ヒントモード利用中',
    'withHint': '（ヒントあり）',
    'button.tryAgain': 'もう一度試す',
    'button.newImage': '新しい画像',
    'button.clear': 'クリア',
    'button.done': '完了',
    'keepPracticing': '練習を続けましょう！線の流れに集中してください。',
    'api.key.missing': 'APIキーが見つかりません',
    'api.key.not-configured': 'APIキーが設定されていません。AIアドバイスを取得できません。',
    'api.unavailable': '現在、AIに接続できません。'
  }
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT,
  setLocale: () => {},
  t: (k) => k
});

export const I18nProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const stored = (localStorage && localStorage.getItem('locale')) || undefined;
      if (stored === 'en' || stored === 'ja') return stored;
    } catch (e) {
      // ignore
    }
    return DEFAULT;
  });

  useEffect(() => {
    try {
      localStorage.setItem('locale', locale);
    } catch (e) {}
  }, [locale]);

  const setLocale = (l: Locale) => setLocaleState(l);

  const t = (key: string) => translations[locale][key] || translations.en[key] || key;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n() {
  return useContext(I18nContext);
}

export default {
  translations
};
