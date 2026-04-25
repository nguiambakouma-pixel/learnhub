// Native fetch used in Node 20+

async function testChat() {
    try {
        const response = await fetch('http://localhost:3001/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Bonjour' }],
                systemPrompt: 'Tu es un assistant utile.'
            })
        });

        const data = await response.json();
        console.log('Réponse du serveur:', data);
    } catch (err) {
        console.error('Erreur lors du test:', err);
    }
}

testChat();
