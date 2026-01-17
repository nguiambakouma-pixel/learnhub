// js/config.js
export const SUPABASE_CONFIG = {
  url: 'https://zbbulpomopfwkqipbehk.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYnVscG9tb3Bmd2txaXBiZWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDM3NDksImV4cCI6MjA3ODk3OTc0OX0.Heak4t8B6vtUIX0SxlOW7W75cn1KD5UYe0lkoO1kW7A'
};

export const STORAGE_BUCKETS = {
  chapitres: 'chapitres-pdfs',
  videos: 'cours-videos'
};

export const FILE_LIMITS = {
  pdf: 10 * 1024 * 1024, // 10 MB
  video: 100 * 1024 * 1024 // 100 MB
};

export const ROUTES = {
  dashboard: 'dashboard',
  matieres: 'matieres',
  chapitres: 'chapitres',
  cours: 'cours',
  exercices: 'exercices',
  utilisateurs: 'utilisateurs'
};

export const PARCOURS_CONFIG = {
  eleve: { 
    label: '🎓 Élève', 
    color: 'blue' 
  },
  'dev-web': { 
    label: '💻 Développeur Web', 
    color: 'green' 
  },
  designer: { 
    label: '🎨 Designer', 
    color: 'purple' 
  },
  commun: { 
    label: 'Commun', 
    color: 'gray' 
  }
};