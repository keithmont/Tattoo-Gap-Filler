import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();


async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === "production";

  console.log(`Starting server in ${isProd ? "production" : "development"} mode`);

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} (Mode: ${isProd ? "PROD" : "DEV"})`);
    next();
  });

  // 1. API ROUTES
  const apiRouter = express.Router();

  apiRouter.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV,
      time: new Date().toISOString()
    });
  });

  apiRouter.post("/generate-tattoo", async (req, res) => {
    const { prompt, style } = req.body;
    if (!prompt || !style) {
      return res.status(400).json({ error: "Prompt and style are required" });
    }

    let apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API Key is missing" });
    }

    apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
    const aiInstance = new GoogleGenAI({ apiKey });

    const fullPrompt = `A single, isolated ${style} tattoo flash illustration of a ${prompt}. Bold black outlines, saturated colors, vintage aesthetic, white background, high contrast, sticker style. No skin, no background, just the tattoo design.`;

    try {
      const response = await aiInstance.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ parts: [{ text: fullPrompt }] }],
        config: { 
          imageConfig: { 
            aspectRatio: "1:1"
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
        res.status(500).json({ error: "No image data returned" });
      }
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.use("/api", apiRouter);

  // 3. STATIC / SPA HANDLING
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`Serving static files from: ${distPath}`);
    
    app.use(express.static(distPath));
    
    // SPA fallback: handle all other routes by serving index.html
    // But ONLY if it's not an API route (which should have been caught above)
    app.get("*", (req, res, next) => {
      if (req.url.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) {
          console.error("Error sending index.html:", err);
          res.status(404).send("Site is still building or index.html is missing. Please try again in a moment.");
        }
      });
    });
  }

  // 4. API 404 HANDLER (If it reached here and starts with /api)
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found", path: req.originalUrl });
  });

  // 5. GLOBAL ERROR HANDLER
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
