// ================================================
// CONFIG.JS - Configuration globale
// ================================================

window.CONFIG = {
  supabase: {
    url: window.SUPABASE_SECRETS ? window.SUPABASE_SECRETS.url : 'https://zbbulpomopfwkqipbehk.supabase.co',
    key: window.SUPABASE_SECRETS ? window.SUPABASE_SECRETS.key : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYnVscG9tb3Bmd2txaXBiZWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDM3NDksImV4cCI6MjA3ODk3OTc0OX0.Heak4t8B6vtUIX0SxlOW7W75cn1KD5UYe0lkoO1kW7A'
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