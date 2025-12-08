// ==========================================
// CONFIG.JS - Configuration Supabase
// ==========================================

const CONFIG = {
    SUPABASE_URL: 'https://zbbulpomopfwkqipbehk.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYnVscG9tb3Bmd2txaXBiZWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDM3NDksImV4cCI6MjA3ODk3OTc0OX0.Heak4t8B6vtUIX0SxlOW7W75cn1KD5UYe0lkoO1kW7A'
};

const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

const APP_STATE = {
    currentView: 'dashboard',
    currentUser: null,
    editingMatiereId: null,
    editingChapitreId: null
};

export { CONFIG, supabase, APP_STATE };