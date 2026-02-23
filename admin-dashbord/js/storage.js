// ================================================
// STORAGE.JS - Gestion des uploads de fichiers
// ================================================

const Storage = {
    /**
     * Upload une image
     */
    async uploadImage(file, lang = 'fr') {
        // Vérifier la taille
        if (file.size > CONFIG.storage.images.maxSize) {
            Utils.showToast(`Image trop volumineuse (max ${CONFIG.storage.images.maxSize / 1024 / 1024} MB)`, 'error');
            return null;
        }

        // Vérifier le type
        if (!CONFIG.storage.images.allowedTypes.includes(file.type)) {
            Utils.showToast('Type de fichier non supporté', 'error');
            return null;
        }

        try {
            const fileName = `images/${Date.now()}_${file.name}`;

            const { data, error } = await supabaseClient.storage
                .from(CONFIG.storage.images.bucket)
                .upload(fileName, file);

            if (error) throw error;

            const { data: publicUrl } = supabaseClient.storage
                .from(CONFIG.storage.images.bucket)
                .getPublicUrl(fileName);

            // Mettre à jour l'état et l'interface
            if (lang === 'fr') {
                AppState.currentImageUrlFr = publicUrl.publicUrl;
                this.updateImagePreview(publicUrl.publicUrl, 'imagePreviewFr');
            } else if (lang === 'an') {
                AppState.currentImageUrlAn = publicUrl.publicUrl;
                this.updateImagePreview(publicUrl.publicUrl, 'imagePreviewAn');
            }

            Utils.showToast('✅ Image uploadée avec succès', 'success');
            return publicUrl.publicUrl;

        } catch (error) {
            console.error('Erreur upload image:', error);
            Utils.showToast('❌ Erreur lors de l\'upload de l\'image', 'error');
            return null;
        }
    },

    /**
     * Upload un PDF
     */
    async uploadPdf(file, lang = 'fr') {
        // Vérifier la taille
        if (file.size > CONFIG.storage.pdfs.maxSize) {
            Utils.showToast(`PDF trop volumineux (max ${CONFIG.storage.pdfs.maxSize / 1024 / 1024} MB)`, 'error');
            return null;
        }

        // Vérifier le type
        if (!CONFIG.storage.pdfs.allowedTypes.includes(file.type)) {
            Utils.showToast('Seuls les fichiers PDF sont acceptés', 'error');
            return null;
        }

        try {
            const fileName = `pdfs/${Date.now()}_${file.name}`;

            const { data, error } = await supabaseClient.storage
                .from(CONFIG.storage.pdfs.bucket)
                .upload(fileName, file);

            if (error) throw error;

            const { data: publicUrl } = supabaseClient.storage
                .from(CONFIG.storage.pdfs.bucket)
                .getPublicUrl(fileName);

            // Mettre à jour l'état et l'interface
            if (lang === 'fr') {
                AppState.currentPdfUrlFr = publicUrl.publicUrl;
                this.updatePdfPreview(file.name, 'pdfPreviewFr');
            } else if (lang === 'an') {
                AppState.currentPdfUrlAn = publicUrl.publicUrl;
                this.updatePdfPreview(file.name, 'pdfPreviewAn');
            }

            Utils.showToast('✅ PDF uploadé avec succès', 'success');
            return publicUrl.publicUrl;

        } catch (error) {
            console.error('Erreur upload PDF:', error);
            Utils.showToast('❌ Erreur lors de l\'upload du PDF', 'error');
            return null;
        }
    },

    /**
     * Mettre à jour la prévisualisation de l'image
     */
    updateImagePreview(url, elementId) {
        const preview = document.getElementById(elementId);
        if (preview) {
            preview.innerHTML = `
                <img src="${url}" class="w-full h-32 object-cover rounded-lg mb-2">
                <p class="text-sm text-emerald-400">✅ ${elementId.includes('An') ? 'Image uploaded' : 'Image uploadée'}</p>
            `;
        }
    },

    /**
     * Mettre à jour la prévisualisation du PDF
     */
    updatePdfPreview(fileName, elementId) {
        const preview = document.getElementById(elementId);
        if (preview) {
            preview.innerHTML = `
                <p class="text-sm text-emerald-400">✅ ${fileName}</p>
            `;
        }
    },

    /**
     * Réinitialiser les uploads
     */
    resetUploads(lang = 'fr') {
        if (lang === 'fr') {
            AppState.currentImageUrlFr = null;
            AppState.currentPdfUrlFr = null;

            // Réinitialiser les previews
            const imagePreview = document.getElementById('imagePreviewFr');
            if (imagePreview) {
                imagePreview.innerHTML = `
                    <div class="text-4xl mb-2">📷</div>
                    <p class="text-gray-400">Cliquez pour choisir une image</p>
                    <p class="text-xs text-gray-500 mt-2">JPG, PNG (Max 5 MB)</p>
                `;
            }

            const pdfPreview = document.getElementById('pdfPreviewFr');
            if (pdfPreview) {
                pdfPreview.innerHTML = `
                    <p class="text-gray-400">📎 Cliquez pour choisir un PDF</p>
                `;
            }

            // Réinitialiser les inputs
            const imageInput = document.getElementById('imageFr');
            const pdfInput = document.getElementById('pdfFr');
            if (imageInput) imageInput.value = '';
            if (pdfInput) pdfInput.value = '';
        } else if (lang === 'an') {
            AppState.currentImageUrlAn = null;
            AppState.currentPdfUrlAn = null;

            const imagePreview = document.getElementById('imagePreviewAn');
            if (imagePreview) {
                imagePreview.innerHTML = `
                    <div class="text-4xl mb-2">📷</div>
                    <p class="text-gray-400">Click to choose an image</p>
                    <p class="text-xs text-gray-500 mt-2">JPG, PNG (Max 5 MB)</p>
                `;
            }

            const pdfPreview = document.getElementById('pdfPreviewAn');
            if (pdfPreview) {
                pdfPreview.innerHTML = `
                    <p class="text-gray-400">📎 Click to choose a PDF</p>
                `;
            }

            const imageInput = document.getElementById('imageAn');
            const pdfInput = document.getElementById('pdfAn');
            if (imageInput) imageInput.value = '';
            if (pdfInput) pdfInput.value = '';
        }
    }
};

// ================================================
// FONCTIONS GLOBALES POUR COMPATIBILITÉ HTML
// ================================================
window.handleImageUpload = (event, lang) => {
    const file = event.target.files[0];
    if (file) Storage.uploadImage(file, lang);
};

window.handlePdfUpload = (event, lang) => {
    const file = event.target.files[0];
    if (file) Storage.uploadPdf(file, lang);
};