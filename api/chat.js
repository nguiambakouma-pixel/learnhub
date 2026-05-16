import Groq from "groq-sdk";

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { messages } = req.body;
        
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Clé API Groq manquante. Veuillez configurer GROQ_API_KEY dans Vercel." });
        }

        const groq = new Groq({ apiKey });

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "Tu es KmerAI, l'assistant IA éducatif de la plateforme KMERSCHOOL, spécialisé dans le curriculum scolaire camerounais. Tu aides les élèves à comprendre leurs cours, à s'exercer et à préparer leurs examens (BEPC, Probatoire, BAC, GCE)."
                },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 1500,
        });

        const text = completion.choices[0]?.message?.content || "";

        res.status(200).json({ reply: text });

    } catch (error) {
        console.error('❌ Groq Error:', error);
        res.status(500).json({ error: error.message || "Erreur lors de la génération de la réponse" });
    }
}
