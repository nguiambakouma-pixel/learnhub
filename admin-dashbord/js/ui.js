// js/ui.js
class UIManager {
  constructor() {
    this.currentModal = null;
  }

  // NOTIFICATIONS
  showNotification(message, type = 'success') {
    const colors = {
      success: 'bg-green-50 border-green-500 text-green-800',
      error: 'bg-red-50 border-red-500 text-red-800',
      warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
      info: 'bg-blue-50 border-blue-500 text-blue-800'
    };

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg border-l-4 shadow-lg ${colors[type]} animate-slide-in`;
    notification.style.animation = 'slideIn 0.3s ease-out';
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <span class="text-2xl">${icons[type]}</span>
        <p class="font-semibold">${message}</p>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      notification.style.transition = 'all 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // LOADING
  showLoading(container) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;

    el.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Chargement...</p>
      </div>
    `;
  }

  showError(container, message) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;

    el.innerHTML = `
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg class="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-red-700 font-semibold">${message}</p>
      </div>
    `;
  }

  showEmpty(container, message, icon = null) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;

    const defaultIcon = `
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
      </svg>
    `;

    el.innerHTML = `
      <div class="bg-white rounded-xl shadow-sm p-12 text-center">
        ${icon || defaultIcon}
        <p class="text-gray-500 text-lg">${message}</p>
      </div>
    `;
  }

  // MODALS
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      this.currentModal = modalId;
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      this.currentModal = null;
      document.body.style.overflow = '';
    }
  }

  closeCurrentModal() {
    if (this.currentModal) {
      this.closeModal(this.currentModal);
    }
  }

  // CONFIRMATION
  async confirm(message, title = 'Confirmation') {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
      overlay.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
          <h3 class="text-xl font-bold text-gray-900 mb-3">${title}</h3>
          <p class="text-gray-600 mb-6 whitespace-pre-line">${message}</p>
          <div class="flex gap-3">
            <button id="confirmBtn" class="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition">
              Confirmer
            </button>
            <button id="cancelBtn" class="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
              Annuler
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      overlay.querySelector('#confirmBtn').onclick = () => {
        overlay.remove();
        resolve(true);
      };

      overlay.querySelector('#cancelBtn').onclick = () => {
        overlay.remove();
        resolve(false);
      };

      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.remove();
          resolve(false);
        }
      };
    });
  }

  // FORM HELPERS
  setFormLoading(formId, loading = true) {
    const form = document.getElementById(formId);
    if (!form) return;

    const submitBtn = form.querySelector('[type="submit"]');
    const submitText = submitBtn?.querySelector('.submit-text');
    const submitLoader = submitBtn?.querySelector('.submit-loader');

    if (submitBtn) {
      submitBtn.disabled = loading;
      if (submitText) submitText.classList.toggle('hidden', loading);
      if (submitLoader) submitLoader.classList.toggle('hidden', !loading);
    }
  }

  resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
  }

  // PAGE HELPERS
  setPageTitle(title, subtitle) {
    const titleEl = document.getElementById('pageTitle');
    const subtitleEl = document.getElementById('pageSubtitle');
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
  }

  showAddButton(show = true) {
    const btn = document.getElementById('addNewBtn');
    if (btn) btn.classList.toggle('hidden', !show);
  }

  // FILE PREVIEW HELPERS
  showFilePreview(previewId, fileName, fileSize) {
    const preview = document.getElementById(previewId);
    if (!preview) return;

    preview.classList.remove('hidden');
    const nameEl = preview.querySelector('[data-file-name]');
    const sizeEl = preview.querySelector('[data-file-size]');
    
    if (nameEl) nameEl.textContent = fileName;
    if (sizeEl) sizeEl.textContent = this.formatFileSize(fileSize);
  }

  hideFilePreview(previewId) {
    const preview = document.getElementById(previewId);
    if (preview) preview.classList.add('hidden');
  }

  // FORMAT HELPERS
  formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // UTILITY
  truncate(text, length = 100) {
    if (!text || text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export const ui = new UIManager();