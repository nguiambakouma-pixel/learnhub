@echo off
echo ==========================================
echo   Lancement du Serveur KmerAI (Gemini)
echo ==========================================
cd kmerai-server
echo [1/2] Verification des dependances...
call npm install
echo [2/2] Demarrage du serveur sur le port 3000...
node server.js
pause
