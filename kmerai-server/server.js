import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "Tu es KmerAI, l'assistant IA éducatif de la plateforme KMERSCHOOL, spécialisé dans le curriculum scolaire camerounais."
});

app.post("/chat", async (req, res) => {
    try {
        const { messages, systemPrompt } = req.body;
        console.log(`[${new Date().toLocaleTimeString()}] 📨 Nouveau message reçu`);

        const chat = model.startChat({
            history: messages.slice(0, -1).map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            })),
            generationConfig: {
                maxOutputTokens: 1500,
            },
        });

        // Use the systemPrompt provided by frontend if available
        const lastMessage = messages[messages.length - 1].content;
        const result = await chat.sendMessage(lastMessage);
        const response = await result.response;
        const text = response.text();

        console.log(`[${new Date().toLocaleTimeString()}] ✅ Réponse générée`);
        res.json({ reply: text });

    } catch (error) {
        console.error('❌ Gemini Error:', error);

        let status = 500;
        let message = error.message || "Erreur inconnue";

        if (message.includes('fetch failed')) {
            message = "Impossible de contacter l'API Google Gemini (Problème de connexion internet ou pare-feu).";
        } else if (message.includes('API_KEY_INVALID')) {
            message = "La clé API Gemini est invalide. Veuillez vérifier votre fichier .env";
        }

        res.status(status).json({ error: message });
    }
});

app.listen(3000, () => {
    console.log("✅ Serveur KmerAI (Gemini) lancé sur http://localhost:3000");
});