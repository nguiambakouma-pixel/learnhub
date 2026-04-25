
import dotenv from "dotenv";

dotenv.config();

async function run() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("AVAILABLE MODELS:");
        if (data.models) {
            data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`));
        } else {
            console.log("Response:", data);
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

run();
