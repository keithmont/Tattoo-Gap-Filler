import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateTattooImage = async (prompt: string, style: string) => {
  const fullPrompt = `A single, isolated ${style} tattoo flash illustration of a ${prompt}. 
  Bold black outlines, saturated colors, vintage aesthetic, white background, high contrast, sticker style. 
  No skin, no background, just the tattoo design.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ parts: [{ text: fullPrompt }] }],
    });

    // Find the image part in the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from Gemini");
  } catch (error) {
    console.error("Error generating tattoo image:", error);
    throw error;
  }
};

export const generateFlashDescription = async (style: 'American Traditional' | 'Japanese Traditional') => {
  const prompt = `Generate a short, evocative description for a ${style} tattoo flash piece. 
  If American Traditional, think Sailor Jerry or Bert Grimm (bold lines, limited palette). 
  If Japanese Traditional, think Shodai Horiyoshi (mythological, flowing).
  Return only the name of the design and a 1-sentence description.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating flash description:", error);
    return "Classic Tattoo Design";
  }
};
