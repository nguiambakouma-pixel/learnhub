import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function run() {
    try {
        const key = process.env.GEMINI_API_KEY;
        console.log("-----------------------------------------");
        console.log("🛠 DIAGNOSTIQUES KmerAI (Gemini)");
        console.log("-----------------------------------------");
        console.log("Clé API présente :", key ? "OUI (" + key.substring(0, 5) + "...)" : "NON");

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        console.log("Envoi d'un message de test à Google...");
        const result = await model.generateContent("Réponds juste 'OK' si tu me reçois.");
        const response = await result.response;
        const text = response.text();
        console.log("✅ Connexion réussie !");
        console.log("Réponse de l'IA :", text);
    } catch (error) {
        console.error("❌ Erreur de diagnostique :");
        console.error("Message :", error.message);
        if (error.message.includes('fetch failed')) {
            console.error("\nCONSEIL : Votre machine semble bloquer la connexion vers Google (Vérifiez votre pare-feu ou votre connexion internet).");
        }
    }
}

run();
