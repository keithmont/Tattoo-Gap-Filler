import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Tattoo Generation
  app.post("/api/generate-tattoo", async (req, res) => {
    const { prompt, style } = req.body;

    if (!prompt || !style) {
      return res.status(400).json({ error: "Prompt and style are required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing from environment");
      return res.status(500).json({ error: "API Key is missing. Please set GEMINI_API_KEY in settings." });
    }

    const aiInstance = new GoogleGenAI({ apiKey });

    const fullPrompt = `A single, isolated ${style} tattoo flash illustration of a ${prompt}. 
    Bold black outlines, saturated colors, vintage aesthetic, white background, high contrast, sticker style. 
    No skin, no background, just the tattoo design.`;

    try {
      console.log("Generating tattoo for prompt:", prompt);
      
      const response = await aiInstance.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ parts: [{ text: fullPrompt }] }],
      });

      console.log("Gemini response received");

      let imageData = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageData) {
        res.json({ imageUrl: imageData });
      } else {
        res.status(500).json({ error: "No image data returned from Gemini" });
      }
    } catch (error: any) {
      console.error("Error generating tattoo image:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
