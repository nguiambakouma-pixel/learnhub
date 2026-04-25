// Test Gemini backend
async function testGemini() {
    try {
        const response = await fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Bonjour, qui es-tu ?' }],
                systemPrompt: 'Tu es KmerAI, un assistant éducatif pour les élèves camerounais.'
            })
        });

        const data = await response.json();
        console.log('Réponse Gemini:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Erreur test:', err);
    }
}

testGemini();
