import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

app.post("/chat", async (req, res) => {
    try {
        const { messages, systemPrompt } = req.body;
        console.log(`[${new Date().toLocaleTimeString()}] 📨 Nouveau message reçu (Groq Llama 3.3)`);

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: systemPrompt || "Tu es KmerAI, l'assistant IA éducatif de la plateforme KMERSCHOOL, spécialisé dans le curriculum scolaire camerounais."
                },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 1500,
        });

        const text = completion.choices[0]?.message?.content || "";

        console.log(`[${new Date().toLocaleTimeString()}] ✅ Réponse générée`);
        res.json({ reply: text });

    } catch (error) {
        console.error('❌ Groq Error:', error);

        let status = 500;
        let message = error.message || "Erreur inconnue";

        if (message.includes('API_KEY_INVALID') || message.includes('401')) {
            message = "La clé API Groq est invalide ou manquante. Veuillez vérifier votre fichier .env";
        }

        res.status(status).json({ error: message });
    }
});

app.listen(3000, () => {
    console.log("✅ Serveur KmerAI (Llama 3.3 70B via Groq) lancé sur http://localhost:3000");
});