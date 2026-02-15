// js/exercices-code.js
const SUPABASE_URL = 'https://zbbulpomopfwkqipbehk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYnVscG9tb3Bmd2txaXBiZWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDM3NDksImV4cCI6MjA3ODk3OTc0OX0.Heak4t8B6vtUIX0SxlOW7W75cn1KD5UYe0lkoO1kW7A'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

let currentUser = null
let currentExercice = null
let editor = null
let allExercices = []
let userSubmissions = []

// ==========================================
// INITIALISATION
// ==========================================

async function init() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        window.location.href = '../login.html'
        return
    }

    currentUser = user
    await loadUserProfile()
    await loadExercices()
    await loadUserStats()
    setupFilters()
}

async function loadUserProfile() {
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()

        if (!profile || profile.type_parcours !== 'dev-web') {
            window.location.href = 'dashboard-dev.html'
            return
        }

        document.getElementById('userName').textContent = profile.nom
        document.getElementById('userAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.nom)}&background=10b981&color=fff`
    } catch (error) {
        console.error('Erreur chargement profil:', error)
    }
}

// ==========================================
// CHARGEMENT DES DONNÉES
// ==========================================

async function loadExercices() {
    try {
        // Charger tous les exercices actifs
        const { data: exercices, error: exError } = await supabase
            .from('exercices_code')
            .select(`
                *,
                cours:cours(
                    id, 
                    titre,
                    chapitre:chapitres(
                        titre,
                        matiere:matieres(nom, couleur)
                    )
                )
            `)
            .eq('est_actif', true)
            .order('created_at', { ascending: false })

        if (exError) throw exError

        // Charger les soumissions de l'utilisateur
        const { data: submissions, error: subError } = await supabase
            .from('soumissions_code')
            .select('*')
            .eq('user_id', currentUser.id)

        if (subError) throw subError

        allExercices = exercices || []
        userSubmissions = submissions || []

        renderExercices(allExercices)
    } catch (error) {
        console.error('Erreur chargement exercices:', error)
        document.getElementById('exercicesList').innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p class="text-red-700">❌ Erreur lors du chargement des exercices</p>
            </div>
        `
    }
}

async function loadUserStats() {
    try {
        // Calculer les stats basées sur les soumissions
        const reussis = userSubmissions.filter(s => s.est_reussi).length
        const total = new Set(userSubmissions.map(s => s.exercice_id)).size
        const pointsGagnes = userSubmissions
            .filter(s => s.est_reussi)
            .reduce((sum, s) => sum + (s.points_obtenus || 0), 0)

        const taux = total > 0 ? ((reussis / total) * 100).toFixed(0) : 0

        document.getElementById('statsReussis').textContent = reussis
        document.getElementById('statsPoints').textContent = pointsGagnes
        document.getElementById('statsTaux').textContent = taux + '%'
        document.getElementById('statsTemps').textContent = '0h' // TODO: calculer le temps réel
    } catch (error) {
        console.error('Erreur stats:', error)
    }
}

// ==========================================
// AFFICHAGE DES EXERCICES
// ==========================================

function renderExercices(exercices) {
    const container = document.getElementById('exercicesList')

    if (!exercices || exercices.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm p-12 text-center">
                <div class="text-6xl mb-4">💻</div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Aucun exercice disponible</h3>
                <p class="text-gray-500">Les exercices de code seront bientôt disponibles !</p>
            </div>
        `
        return
    }

    container.innerHTML = exercices.map(ex => renderExerciceCard(ex)).join('')
}

function renderExerciceCard(ex) {
    const langageIcons = {
        'javascript': '🟨 JavaScript',
        'python': '🐍 Python',
        'html': '🌐 HTML',
        'css': '🎨 CSS',
        'sql': '🗄️ SQL'
    }

    const difficulteIcons = {
        'facile': '⭐',
        'moyen': '⭐⭐',
        'difficile': '⭐⭐⭐'
    }

    // Vérifier si l'utilisateur a réussi cet exercice
    const submission = userSubmissions.find(s => s.exercice_id === ex.id && s.est_reussi)
    const hasSubmission = userSubmissions.some(s => s.exercice_id === ex.id)

    let statusBadge = ''
    let cardClass = 'border-gray-200'

    if (submission) {
        statusBadge = '<span class="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">✅ Réussi</span>'
        cardClass = 'border-green-200 bg-green-50'
    } else if (hasSubmission) {
        statusBadge = '<span class="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">⏳ En cours</span>'
        cardClass = 'border-orange-200'
    }

    const couleur = ex.cours?.chapitre?.matiere?.couleur || '#10b981'

    return `
        <div class="bg-white rounded-xl shadow-sm border-2 ${cardClass} p-6 hover:shadow-lg transition cursor-pointer" 
             onclick="openEditor(${ex.id})"
             data-langage="${ex.langage}"
             data-difficulte="${ex.difficulte}"
             data-statut="${submission ? 'reussi' : hasSubmission ? 'en-cours' : 'non-tente'}">
            
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-start space-x-3 flex-1">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" 
                         style="background: ${couleur}20; color: ${couleur};">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-gray-900 mb-2">${ex.titre}</h3>
                        <p class="text-sm text-gray-600 mb-3">${ex.description || 'Pas de description'}</p>
                        
                        <div class="flex items-center flex-wrap gap-2">
                            <span class="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                                ${langageIcons[ex.langage] || ex.langage}
                            </span>
                            <span class="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                                ${difficulteIcons[ex.difficulte]} ${ex.difficulte}
                            </span>
                            <span class="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">
                                🏆 ${ex.points_recompense} points
                            </span>
                            ${statusBadge}
                        </div>
                    </div>
                </div>
            </div>

            ${ex.cours ? `
                <div class="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                    📚 ${ex.cours.chapitre?.matiere?.nom} • ${ex.cours.chapitre?.titre} • ${ex.cours.titre}
                </div>
            ` : ''}
        </div>
    `
}

// ==========================================
// FILTRES
// ==========================================

function setupFilters() {
    const langageFilter = document.getElementById('filterLangage')
    const difficulteFilter = document.getElementById('filterDifficulte')
    const statutFilter = document.getElementById('filterStatut')

    const applyFilters = () => {
        const langage = langageFilter.value
        const difficulte = difficulteFilter.value
        const statut = statutFilter.value

        const filtered = allExercices.filter(ex => {
            const matchLangage = !langage || ex.langage === langage
            const matchDifficulte = !difficulte || ex.difficulte === difficulte

            let matchStatut = true
            if (statut) {
                const submission = userSubmissions.find(s => s.exercice_id === ex.id && s.est_reussi)
                const hasSubmission = userSubmissions.some(s => s.exercice_id === ex.id)

                if (statut === 'reussi') matchStatut = !!submission
                else if (statut === 'en-cours') matchStatut = hasSubmission && !submission
                else if (statut === 'non-tente') matchStatut = !hasSubmission
            }

            return matchLangage && matchDifficulte && matchStatut
        })

        renderExercices(filtered)
    }

    langageFilter.addEventListener('change', applyFilters)
    difficulteFilter.addEventListener('change', applyFilters)
    statutFilter.addEventListener('change', applyFilters)
}

// ==========================================
// ÉDITEUR MONACO
// ==========================================

async function openEditor(exerciceId) {
    const exercice = allExercices.find(ex => ex.id === exerciceId)
    if (!exercice) return

    currentExercice = exercice

    // Afficher le modal
    document.getElementById('editorModal').classList.remove('hidden')
    document.getElementById('modalTitle').textContent = exercice.titre
    document.getElementById('modalSubtitle').textContent = `${exercice.langage.toUpperCase()} • ${exercice.difficulte} • ${exercice.points_recompense} points`
    document.getElementById('exerciceDescription').textContent = exercice.description || 'Complétez le code selon les instructions.'

    const langageIcons = {
        'javascript': '🟨 JavaScript',
        'python': '🐍 Python',
        'html': '🌐 HTML',
        'css': '🎨 CSS',
        'sql': '🗄️ SQL'
    }
    document.getElementById('langageBadge').textContent = langageIcons[exercice.langage] || exercice.langage

    // Initialiser Monaco Editor
    await initMonaco(exercice)

    // Réinitialiser les résultats
    document.getElementById('testResults').innerHTML = '<p class="text-sm text-gray-500">Exécutez votre code pour voir les résultats...</p>'
    document.getElementById('consoleOutput').classList.add('hidden')
    document.getElementById('errorOutput').classList.add('hidden')
}

function initMonaco(exercice) {
    return new Promise((resolve) => {
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } })

        require(['vs/editor/editor.main'], function () {
            // Détruire l'éditeur existant s'il existe
            if (editor) {
                editor.dispose()
            }

            const langageMap = {
                'javascript': 'javascript',
                'python': 'python',
                'html': 'html',
                'css': 'css',
                'sql': 'sql'
            }

            // Créer l'éditeur
            editor = monaco.editor.create(document.getElementById('editor'), {
                value: exercice.code_initial || `// Écrivez votre code ici\n`,
                language: langageMap[exercice.langage] || 'javascript',
                theme: 'vs-dark',
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true
            })

            resolve()
        })
    })
}

window.closeEditor = function () {
    document.getElementById('editorModal').classList.add('hidden')
    if (editor) {
        editor.dispose()
        editor = null
    }
}

window.resetCode = function () {
    if (editor && currentExercice) {
        editor.setValue(currentExercice.code_initial || `// Écrivez votre code ici\n`)
    }
}

// ==========================================
// EXÉCUTION DU CODE
// ==========================================

// ==========================================
// AJOUT SUPPORT MULTI-LANGAGES
// ==========================================

/**
 * Exécute du code selon le langage spécifié
 */
async function executeCode(code, langage) {
    switch (langage) {
        case 'javascript':
            return await executeJavaScript(code);

        case 'html':
        case 'css':
            return await executeHTML(code, langage);

        case 'python':
        case 'php':
            return await executePiston(code, langage);

        default:
            throw new Error(`Langage ${langage} non supporté`);
    }
}

/**
 * Exécuteur JavaScript (utilise eval)
 */
async function executeJavaScript(code) {
    const logs = [];
    const originalLog = console.log;

    console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
    };

    try {
        const result = eval(code);
        console.log = originalLog;

        return {
            success: true,
            output: logs.join('\n'),
            result: result
        };
    } catch (error) {
        console.log = originalLog;
        throw error;
    }
}

/**
 * Exécuteur HTML/CSS (utilise iframe)
 */
async function executeHTML(code, langage) {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width: 100%; height: 400px; border: 2px solid #10b981; border-radius: 12px; background: white;';

    // Créer le container s'il n'existe pas
    let previewContainer = document.getElementById('htmlPreview');
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.id = 'htmlPreview';
        previewContainer.className = 'mt-4 bg-white rounded-xl p-4 border-2 border-green-200';
        document.getElementById('consoleOutput').parentElement.insertBefore(
            previewContainer,
            document.getElementById('consoleOutput')
        );
    }

    previewContainer.innerHTML = '<h3 class="text-lg font-bold text-green-800 mb-3 flex items-center"><svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path></svg>Aperçu du rendu :</h3>';
    previewContainer.appendChild(iframe);

    if (langage === 'html') {
        iframe.srcdoc = code;
    } else if (langage === 'css') {
        iframe.srcdoc = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>${code}</style>
            </head>
            <body style="padding: 20px; font-family: Arial, sans-serif;">
                <h1>Titre H1</h1>
                <h2>Titre H2</h2>
                <p>Ceci est un paragraphe de test avec du texte.</p>
                <div class="test">Élément avec classe "test"</div>
                <button>Bouton de test</button>
                <ul>
                    <li>Item 1</li>
                    <li>Item 2</li>
                    <li>Item 3</li>
                </ul>
            </body>
            </html>
        `;
    }

    return {
        success: true,
        output: '✅ Code affiché dans l\'aperçu ci-dessus',
        result: null
    };
}

/**
 * Exécuteur Python/PHP via API Piston
 * Documentation: https://piston.readthedocs.io
 */
async function executePiston(code, langage) {
    const languageMap = {
        'python': { language: 'python', version: '3.10.0' },
        'php': { language: 'php', version: '8.2.3' }
    };

    const config = languageMap[langage];

    if (!config) {
        throw new Error(`Langage ${langage} non configuré pour Piston API`);
    }

    showNotification('⏳ Exécution sur le serveur...', 'info');

    try {
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                language: config.language,
                version: config.version,
                files: [{
                    name: `main.${langage === 'python' ? 'py' : 'php'}`,
                    content: code
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }

        const result = await response.json();

        if (result.run) {
            const hasError = result.run.stderr && result.run.stderr.trim().length > 0;

            return {
                success: !hasError,
                output: result.run.stdout || result.run.output || '',
                error: result.run.stderr
            };
        } else {
            throw new Error('Réponse API invalide');
        }

    } catch (error) {
        throw new Error(`Erreur d'exécution ${langage}: ${error.message}`);
    }
}

window.runCode = async function () {
    if (!editor || !currentExercice) return;

    const code = editor.getValue().trim();

    if (!code) {
        showNotification('⚠️ Écris du code avant d\'exécuter', 'warning');
        return;
    }

    // Nettoyer les résultats précédents
    document.getElementById('errorOutput').classList.add('hidden');
    document.getElementById('consoleOutput').classList.remove('hidden');
    clearConsole();

    // Nettoyer l'aperçu HTML/CSS si existe
    const htmlPreview = document.getElementById('htmlPreview');
    if (htmlPreview) htmlPreview.remove();

    try {
        // Afficher un loader
        document.getElementById('consoleContent').innerHTML = '<div class="text-yellow-400 animate-pulse">⏳ Exécution en cours...</div>';

        // UTILISER LA NOUVELLE FONCTION executeCode()
        const result = await executeCode(code, currentExercice.langage);

        // Afficher la sortie
        if (result.output) {
            document.getElementById('consoleContent').innerHTML =
                result.output.split('\n').map(line =>
                    `<div class="text-green-400">> ${escapeHtml(line)}</div>`
                ).join('');
        } else {
            document.getElementById('consoleContent').innerHTML =
                '<div class="text-gray-400"><em>Aucune sortie</em></div>';
        }

        // Afficher les erreurs si présentes
        if (result.error) {
            document.getElementById('errorOutput').classList.remove('hidden');
            document.getElementById('errorContent').textContent = result.error;
        }

        // Exécuter les tests si disponibles (pour JavaScript uniquement pour l'instant)
        if (currentExercice.langage === 'javascript' &&
            currentExercice.tests_unitaires &&
            currentExercice.tests_unitaires.length > 0) {
            await runTests(code);
        } else {
            if (result.success) {
                showNotification('✅ Code exécuté avec succès !', 'success');
            } else {
                showNotification('⚠️ Le code contient des erreurs', 'warning');
            }
        }

    } catch (error) {
        console.error('Erreur exécution:', error);
        document.getElementById('errorOutput').classList.remove('hidden');
        document.getElementById('errorContent').textContent = error.toString();
        document.getElementById('consoleContent').innerHTML =
            '<div class="text-red-400">❌ Échec de l\'exécution</div>';
        showNotification('❌ Erreur d\'exécution', 'error');
    }
}

async function runTests(code) {
    const tests = currentExercice.tests_unitaires
    const results = []

    try {
        for (let test of tests) {
            try {
                // Extraire le nom de la fonction à tester
                const functionMatch = code.match(/function\s+(\w+)\s*\(/)
                if (!functionMatch) {
                    throw new Error('Aucune fonction trouvée dans le code')
                }

                const functionName = functionMatch[1]

                // Créer un contexte d'exécution
                const testCode = `
                    ${code}
                    
                    const result = ${functionName}(${test.input.map(v => JSON.stringify(v)).join(', ')})
                    const expected = ${JSON.stringify(test.expected)}
                    const passed = JSON.stringify(result) === JSON.stringify(expected)
                    
                    ({ result, expected, passed })
                `

                const testResult = eval(testCode)

                results.push({
                    description: test.description,
                    input: test.input,
                    expected: test.expected,
                    result: testResult.result,
                    passed: testResult.passed
                })

            } catch (error) {
                results.push({
                    description: test.description,
                    input: test.input,
                    expected: test.expected,
                    result: null,
                    passed: false,
                    error: error.message
                })
            }
        }

        // Afficher les résultats
        displayTestResults(results)

    } catch (error) {
        console.error('Erreur tests:', error)
        showNotification('❌ Erreur lors de l\'exécution des tests', 'error')
    }
}

function displayTestResults(results) {
    const container = document.getElementById('testResults')
    const passedCount = results.filter(r => r.passed).length
    const totalCount = results.length

    let html = `
        <div class="mb-4 p-3 ${passedCount === totalCount ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} border rounded-lg">
            <p class="font-semibold ${passedCount === totalCount ? 'text-green-900' : 'text-orange-900'}">
                ${passedCount}/${totalCount} tests réussis
            </p>
        </div>
    `

    html += results.map((test, index) => `
        <div class="p-3 border-2 rounded-lg mb-2 ${test.passed ? 'test-passed' : 'test-failed'}">
            <div class="flex items-center justify-between mb-2">
                <span class="font-semibold ${test.passed ? 'text-green-900' : 'text-red-900'}">
                    ${test.passed ? '✅' : '❌'} Test ${index + 1}: ${test.description}
                </span>
            </div>
            <div class="text-sm ${test.passed ? 'text-green-800' : 'text-red-800'}">
                <div><strong>Entrée:</strong> ${JSON.stringify(test.input)}</div>
                <div><strong>Attendu:</strong> ${JSON.stringify(test.expected)}</div>
                <div><strong>Obtenu:</strong> ${JSON.stringify(test.result)}</div>
                ${test.error ? `<div class="text-red-600 mt-1"><strong>Erreur:</strong> ${test.error}</div>` : ''}
            </div>
        </div>
    `).join('')

    container.innerHTML = html
}

window.clearConsole = function () {
    document.getElementById('consoleContent').innerHTML = ''
}

// ==========================================
// SOUMISSION
// ==========================================

window.submitCode = async function () {
    if (!editor || !currentExercice) return

    const code = editor.getValue()

    if (!code || code.trim().length < 10) {
        showNotification('⚠️ Veuillez écrire du code avant de soumettre', 'warning')
        return
    }

    // Exécuter les tests d'abord
    if (currentExercice.langage === 'javascript' && currentExercice.tests_unitaires) {
        try {
            const tests = currentExercice.tests_unitaires
            const results = []

            for (let test of tests) {
                try {
                    const functionMatch = code.match(/function\s+(\w+)\s*\(/)
                    if (!functionMatch) {
                        throw new Error('Aucune fonction trouvée')
                    }

                    const functionName = functionMatch[1]
                    const testCode = `
                        ${code}
                        const result = ${functionName}(${test.input.map(v => JSON.stringify(v)).join(', ')})
                        const expected = ${JSON.stringify(test.expected)}
                        const passed = JSON.stringify(result) === JSON.stringify(expected)
                        ({ result, expected, passed })
                    `

                    const testResult = eval(testCode)
                    results.push(testResult)

                } catch (error) {
                    results.push({ passed: false, error: error.message })
                }
            }

            const passedCount = results.filter(r => r.passed).length
            const totalCount = results.length
            const estReussi = passedCount === totalCount
            const pointsObtenus = estReussi ? currentExercice.points_recompense : Math.floor((passedCount / totalCount) * currentExercice.points_recompense)

            // Enregistrer la soumission
            const { error } = await supabase
                .from('soumissions_code')
                .insert([{
                    user_id: currentUser.id,
                    exercice_id: currentExercice.id,
                    code_soumis: code,
                    est_reussi: estReussi,
                    tests_passes: passedCount,
                    tests_total: totalCount,
                    points_obtenus: pointsObtenus
                }])

            if (error) throw error

            // Mettre à jour les points de l'utilisateur si réussi
            if (estReussi) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('points_total')
                    .eq('id', currentUser.id)
                    .single()

                await supabase
                    .from('profiles')
                    .update({
                        points_total: (profile.points_total || 0) + pointsObtenus
                    })
                    .eq('id', currentUser.id)

                showNotification(`🎉 Exercice réussi ! +${pointsObtenus} points`, 'success')
            } else {
                showNotification(`⚠️ ${passedCount}/${totalCount} tests réussis. +${pointsObtenus} points`, 'warning')
            }

            // Recharger les données
            await loadExercices()
            await loadUserStats()

            // Fermer le modal après un délai
            setTimeout(() => {
                closeEditor()
            }, 2000)

        } catch (error) {
            console.error('Erreur soumission:', error)
            showNotification('❌ Erreur lors de la soumission', 'error')
        }
    } else {
        // Pour les autres langages, enregistrer sans validation automatique
        try {
            const { error } = await supabase
                .from('soumissions_code')
                .insert([{
                    user_id: currentUser.id,
                    exercice_id: currentExercice.id,
                    code_soumis: code,
                    est_reussi: false,
                    tests_passes: 0,
                    tests_total: 0,
                    points_obtenus: 0
                }])

            if (error) throw error

            showNotification('✅ Code soumis ! (validation manuelle requise)', 'success')
            await loadExercices()

            setTimeout(() => {
                closeEditor()
            }, 2000)

        } catch (error) {
            console.error('Erreur soumission:', error)
            showNotification('❌ Erreur lors de la soumission', 'error')
        }
    }
}

// ==========================================
// UTILITAIRES
// ==========================================

function showNotification(message, type = 'success') {
    const colors = {
        success: 'bg-green-50 border-green-500 text-green-800',
        error: 'bg-red-50 border-red-500 text-red-800',
        warning: 'bg-yellow-50 border-yellow-500 text-yellow-800'
    }

    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg border-l-4 shadow-lg ${colors[type]} animate-slide-in`
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
        notification.style.opacity = '0'
        notification.style.transform = 'translateX(100%)'
        notification.style.transition = 'all 0.3s ease'
        setTimeout(() => notification.remove(), 300)
    }, 3000)
}

function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

// Exposer les fonctions globalement
window.openEditor = openEditor

// Init
init()
