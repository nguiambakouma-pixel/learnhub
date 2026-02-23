// ================================================
// UTILS.JS - Fonctions utilitaires
// ================================================

const Utils = {
    /**
     * Afficher un toast de notification
     */
    showToast(message, type = 'info') {
        const colors = {
            success: 'bg-emerald-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-indigo-500'
        };

        const toast = document.createElement('div');
        toast.className = `${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in`;
        toast.textContent = message;

        const container = document.getElementById('toastContainer');
        if (container) {
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);
        }
    },

    /**
     * Formater du texte avec l'éditeur
     */
    formatText(command, lang = 'fr') {
        document.execCommand(command, false, null);
        const editorId = lang === 'fr' ? 'contenuFr' : 'contenuAn';
        const editor = document.getElementById(editorId);
        if (editor) editor.focus();
    },

    /**
     * Formater une date
     */
    formatDate(date, format = 'long') {
        const d = new Date(date);
        const options = format === 'long'
            ? { day: 'numeric', month: 'long', year: 'numeric' }
            : { day: 'numeric', month: 'short', year: 'numeric' };

        return d.toLocaleDateString('fr-FR', options);
    },

    /**
     * Afficher la date actuelle
     */
    displayCurrentDate(elementId = 'currentDate') {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = this.formatDate(new Date(), 'long');
        }
    },

    /**
     * Valider un formulaire
     */
    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;

        const inputs = form.querySelectorAll('[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value || input.value.trim() === '') {
                input.classList.add('border-red-500');
                isValid = false;
            } else {
                input.classList.remove('border-red-500');
            }
        });

        return isValid;
    },

    /**
     * Nettoyer un formulaire
     */
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();

            // Nettoyer les éditeurs contenteditable
            const editors = form.querySelectorAll('[contenteditable]');
            editors.forEach(editor => {
                editor.innerHTML = '';
            });
        }
    },

    /**
     * Débounce une fonction
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Copier du texte dans le presse-papier
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('✅ Copié dans le presse-papier', 'success');
        } catch (error) {
            console.error('Erreur copie:', error);
            this.showToast('❌ Erreur de copie', 'error');
        }
    },

    /**
     * Vider le cache du navigateur
     */
    clearCache() {
        if (confirm('Vider le cache du navigateur ? La page sera rechargée.')) {
            localStorage.clear();
            sessionStorage.clear();
            location.reload(true);
        }
    },

    /**
     * Formater un nombre
     */
    formatNumber(num) {
        return new Intl.NumberFormat('fr-FR').format(num);
    },

    /**
     * Formater une taille de fichier
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
};

// ================================================
// FONCTIONS GLOBALES POUR COMPATIBILITÉ HTML
// ================================================
window.Utils = Utils;
window.formatTextDark = (lang, command) => Utils.formatText(command, lang);