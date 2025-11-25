import { GoogleGenAI } from "@google/genai";

export const getDrawingAdvice = async (score: number, diffs: number[]): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found");
    return "API Key not configured. Can't fetch AI advice.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Analyze where the errors occurred (beginning, middle, end)
    const len = diffs.length;
    const partSize = Math.floor(len / 3);
    const startDiff = diffs.slice(0, partSize).reduce((a,b) => a+b, 0) / partSize;
    const midDiff = diffs.slice(partSize, partSize * 2).reduce((a,b) => a+b, 0) / partSize;
    const endDiff = diffs.slice(partSize * 2).reduce((a,b) => a+b, 0) / partSize;

    let errorLoc = "throughout the shape";
    if (startDiff > midDiff && startDiff > endDiff) errorLoc = "at the beginning";
    else if (midDiff > startDiff && midDiff > endDiff) errorLoc = "in the middle section";
    else if (endDiff > startDiff && endDiff > midDiff) errorLoc = "towards the end";

    const prompt = `
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

    return response.text || "Keep practicing! Focus on the flow of the line.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Could not connect to the AI teacher at the moment.";
  }
};
