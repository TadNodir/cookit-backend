"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const openai_1 = __importDefault(require("openai"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" })); // allow base64 images
const client = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
// Helper: extract base64 mime type
function isDataUrl(u) {
    return /^data:image\/[a-zA-Z]+;base64,/.test(u);
}
app.post("/analyze", async (req, res) => {
    try {
        const { imageDataUrl, prompt } = req.body;
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
        const text = response.output_text ?? "No text output.";
        res.json({ text, raw: response });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err?.message ?? "Server error" });
    }
});
app.listen(process.env.PORT ?? 8787, () => {
    console.log(`Backend running on http://localhost:${process.env.PORT ?? 8787}`);
});
