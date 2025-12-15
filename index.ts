import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import type { Request, Response } from "express";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // allow base64 images

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper: extract base64 mime type
function isDataUrl(u: string) {
  return /^data:image\/[a-zA-Z]+;base64,/.test(u);
}

app.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { imageDataUrl, prompt } = req.body as { imageDataUrl: string; prompt: string };
    if (!imageDataUrl || !isDataUrl(imageDataUrl)) {
      return res.status(400).json({ error: "Missing or invalid image data URL" });
    }

    const response = await client.responses.create({
      model: "gpt-4o-mini", // good, fast multimodal
      // You send a single user message whose content is text + image
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt ?? "Give recipes for the ingredients in the image." },
            { type: "input_image", image_url: imageDataUrl, detail: "high" }
          ]
        }
      ]
    });

    // Convenience accessor: output_text (see docs)
    const text = (response as any).output_text ?? "No text output.";
    res.json({ text, raw: response });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message ?? "Server error" });
  }
});

app.listen(process.env.PORT ?? 8787, () => {
  console.log(`Backend running on http://localhost:${process.env.PORT ?? 8787}`);
});
