// js/api.js
import { SUPABASE_CONFIG, STORAGE_BUCKETS } from './config.js';

class SupabaseAPI {
  constructor() {
    this.client = null;
    this.initClient();
  }

  initClient() {
    const { createClient } = window.supabase;
    this.client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    });
  }

  // AUTH
  async getCurrentUser() {
    const { data: { user }, error } = await this.client.auth.getUser();
    if (error) throw error;
    return user;
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  // MATIÈRES
  async getMatieres(filters = {}) {
    let query = this.client.from('matieres').select('*, chapitres(count)');
    
    if (filters.type_parcours) {
      query = query.eq('type_parcours', filters.type_parcours);
    }
    
    const { data, error } = await query.order('ordre');
    if (error) throw error;
    return data;
  }

  async getMatiereById(id) {
    const { data, error } = await this.client
      .from('matieres')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async createMatiere(matiere) {
    const { data, error } = await this.client
      .from('matieres')
      .insert([matiere])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateMatiere(id, updates) {
    const { data, error } = await this.client
      .from('matieres')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteMatiere(id) {
    const { error } = await this.client.from('matieres').delete().eq('id', id);
    if (error) throw error;
  }

  // CHAPITRES
  async getChapitres(filters = {}) {
    let query = this.client
      .from('chapitres')
      .select('*, matieres(nom, couleur)');
    
    if (filters.matiere_id) {
      query = query.eq('matiere_id', filters.matiere_id);
    }
    
    const { data, error } = await query.order('ordre');
    if (error) throw error;
    return data;
  }

  async getChapitreById(id) {
    const { data, error } = await this.client
      .from('chapitres')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async createChapitre(chapitre) {
    const { data, error } = await this.client
      .from('chapitres')
      .insert([chapitre])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateChapitre(id, updates) {
    const { data, error } = await this.client
      .from('chapitres')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteChapitre(id) {
    const { error } = await this.client.from('chapitres').delete().eq('id', id);
    if (error) throw error;
  }

  // COURS
  async getCours(filters = {}) {
    let query = this.client
      .from('cours')
      .select('*, chapitres(titre, matieres(nom, couleur))');
    
    if (filters.chapitre_id) {
      query = query.eq('chapitre_id', filters.chapitre_id);
    }
    
    const { data, error } = await query.order('ordre');
    if (error) throw error;
    return data;
  }

  async getCoursById(id) {
    const { data, error } = await this.client
      .from('cours')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async createCours(cours) {
    const { data, error } = await this.client
      .from('cours')
      .insert([cours])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateCours(id, updates) {
    const { data, error } = await this.client
      .from('cours')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteCours(id) {
    const { error } = await this.client.from('cours').delete().eq('id', id);
    if (error) throw error;
  }

  // UTILISATEURS
  async getUtilisateurs(filters = {}) {
    let query = this.client.from('profiles').select('*');
    
    if (filters.type_parcours) {
      query = query.eq('type_parcours', filters.type_parcours);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async deleteUtilisateur(id) {
    const { error } = await this.client.from('profiles').delete().eq('id', id);
    if (error) throw error;
  }

  // STATS
  async getStats() {
    const [matieres, chapitres, cours, users] = await Promise.all([
      this.client.from('matieres').select('*', { count: 'exact', head: true }),
      this.client.from('chapitres').select('*', { count: 'exact', head: true }),
      this.client.from('cours').select('*', { count: 'exact', head: true }),
      this.client.from('profiles').select('*', { count: 'exact', head: true })
    ]);

    return {
      matieres: matieres.count || 0,
      chapitres: chapitres.count || 0,
      cours: cours.count || 0,
      utilisateurs: users.count || 0
    };
  }

  // STORAGE
  async uploadFile(bucket, file, path = null) {
    const fileName = path || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    return data.path;
  }

  async deleteFile(bucket, path) {
    const { error } = await this.client.storage.from(bucket).remove([path]);
    if (error) throw error;
  }

  getPublicUrl(bucket, path) {
    const { data } = this.client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}

export const api = new SupabaseAPI();