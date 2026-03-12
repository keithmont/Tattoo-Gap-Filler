import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();


async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. TEST ROUTES (BEFORE EVERYTHING)
  app.get("/ping", (req, res) => {
    console.log("PING received");
    res.send("pong");
  });

  app.get("/api-test", (req, res) => {
    console.log("API-TEST received");
    res.json({ message: "api-test works" });
  });

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // API routes
  const apiRouter = express.Router();

  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  apiRouter.get("/test", (req, res) => {
    res.json({ message: "API is working" });
  });

  apiRouter.post("/generate-tattoo", async (req, res) => {
    const { prompt, style } = req.body;
    console.log(`Generating tattoo: ${prompt} (${style})`);

    if (!prompt || !style) {
      return res.status(400).json({ error: "Prompt and style are required" });
    }

    let apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: "API Key is missing. Please add GEMINI_API_KEY to your settings." 
      });
    }

    apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
    const aiInstance = new GoogleGenAI({ apiKey });

    const fullPrompt = `A single, isolated ${style} tattoo flash illustration of a ${prompt}. 
    Bold black outlines, saturated colors, vintage aesthetic, white background, high contrast, sticker style. 
    No skin, no background, just the tattoo design.`;

    try {
      const response = await aiInstance.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: [{ parts: [{ text: fullPrompt }] }],
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

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
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Mount API router
  app.use("/api", apiRouter);

  // Catch-all for /api that didn't match
  app.all("/api/*", (req, res) => {
    console.log(`[404] API Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: "API Route not found", 
      method: req.method, 
      url: req.url 
    });
  });

  // Vite/Static middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Explicitly handle SPA routing for non-API routes
    app.get(/^(?!\/api).+/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Server Error:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message || "An unexpected error occurred" 
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
