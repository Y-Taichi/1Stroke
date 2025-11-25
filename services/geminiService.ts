import { GoogleGenAI } from "@google/genai";

import i18n from '../i18n';

export const getDrawingAdvice = async (score: number, diffs: number[], locale: 'en' | 'ja' = 'en'): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn(i18n.translations[locale]['api.key.missing'] || 'API Key not found');
    return i18n.translations[locale]['api.key.not-configured'] || "API Key not configured. Can't fetch AI advice.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Analyze where the errors occurred (beginning, middle, end)
    const len = diffs.length;
    const partSize = Math.floor(len / 3);
    const startDiff = diffs.slice(0, partSize).reduce((a,b) => a+b, 0) / partSize;
    const midDiff = diffs.slice(partSize, partSize * 2).reduce((a,b) => a+b, 0) / partSize;
    const endDiff = diffs.slice(partSize * 2).reduce((a,b) => a+b, 0) / partSize;

    let errorLoc = locale === 'ja' ? '図全体' : 'throughout the shape';
    if (startDiff > midDiff && startDiff > endDiff) errorLoc = locale === 'ja' ? '始めの方' : 'at the beginning';
    else if (midDiff > startDiff && midDiff > endDiff) errorLoc = locale === 'ja' ? '中間部分' : 'in the middle section';
    else if (endDiff > startDiff && endDiff > midDiff) errorLoc = locale === 'ja' ? '終わりに向かって' : 'towards the end';

    const prompt = locale === 'ja' ? `
      ユーザーは一筆描き（Hitofude-gaki）の練習をしています。
      画像をトレースした後、記憶から描きました。

      成績:
      - 精度スコア: ${score}% (100%が満点)
      - 最も誤差の出やすい箇所: ${errorLoc}

      練習を続けるための短い励ましと、視覚記憶や手の安定性を高めるための実践的なアドバイスを1〜2文でお願いします。賢い美術の先生のように教えてください。
    ` : `
      The user is practicing "Hitofude-gaki" (Single Stroke Drawing).
      They traced an image, then drew it from memory.

      Here is their performance data:
      - Accuracy Score: ${score}% (100% is perfect)
      - Highest error region: ${errorLoc}

      Provide a short, encouraging, and constructive piece of advice for them to improve their visual memory and hand stability.
      Keep it under 2 sentences. Be like a wise art teacher.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || (i18n.translations[locale]['keepPracticing'] || "Keep practicing! Focus on the flow of the line.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return i18n.translations[locale]['api.unavailable'] || "Could not connect to the AI teacher at the moment.";
  }
};
