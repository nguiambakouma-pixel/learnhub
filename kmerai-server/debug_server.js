import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post("/chat", async (req, res) => {
    try {
        const { messages, systemPrompt } = req.body;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                ...messages.map(m => ({
                    role: m.role,
                    content: m.content
                }))
            ],
            max_tokens: 1500
        });

        const text = response.choices[0].message.content;
        res.json({ reply: text });

    } catch (error) {
        console.error('DEBUG ERROR:', error);
        res.status(500).json({
            error: "Erreur OpenAI",
            message: error.message,
            code: error.code,
            type: error.type
        });
    }
});

app.listen(3001, () => {
    console.log("🐞 Debug server on http://localhost:3001");
});
