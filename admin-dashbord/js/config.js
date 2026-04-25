// ================================================
// CONFIG.JS - Configuration globale
// ================================================

window.CONFIG = {
  supabase: {
    url: window.SUPABASE_SECRETS ? window.SUPABASE_SECRETS.url : 'https://votre-url-supabase.supabase.co',
    key: window.SUPABASE_SECRETS ? window.SUPABASE_SECRETS.key : 'votre-cle-anonyme'
  },
  storage: {
    images: {
      bucket: 'course-images',
      maxSize: 5 * 1024 * 1024, // 5 MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    },
    pdfs: {
      bucket: 'course-pdfs',
      maxSize: 10 * 1024 * 1024, // 10 MB
      allowedTypes: ['application/pdf']
    }
  }
};

// Initialiser Supabase
if (typeof window.supabaseClient === 'undefined') {
  window.supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.key);
}
const supabaseClient = window.supabaseClient;

// État global
window.AppState = {
  currentUser: null,
  currentImageUrlFr: null,
  currentPdfUrlFr: null,
  currentImageUrlAn: null,
  currentPdfUrlAn: null,
  editingCoursIdFr: null,
  editingCoursIdAn: null,
  videoUploadType: 'url' // 'url' or 'upload'
};