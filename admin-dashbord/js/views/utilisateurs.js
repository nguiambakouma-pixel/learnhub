// js/views/utilisateurs.js
import { api } from '../api.js';
import { ui } from '../ui.js';
import { PARCOURS_CONFIG } from '../config.js';

export class UtilisateursView {
  async render() {
    ui.setPageTitle('Utilisateurs', 'Gestion des utilisateurs');
    ui.showAddButton(false);

    const container = document.getElementById('contentArea');
    ui.showLoading(container);

    try {
      const users = await api.getUtilisateurs();
      
      if (!users || users.length === 0) {
        ui.showEmpty(container, 'Aucun utilisateur inscrit', `
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
        `);
        return;
      }

      this.renderList(users);
      this.setupFilters();

    } catch (error) {
      ui.showError(container, error.message);
    }
  }

  renderList(users) {
    const container = document.getElementById('contentArea');

    // Calculate stats
    const stats = {
      total: users.length,
      eleves: users.filter(u => u.type_parcours === 'eleve').length,
      devs: users.filter(u => u.type_parcours === 'dev-web').length,
      designers: users.filter(u => u.type_parcours === 'designer').length,
      actifs: users.filter(u => {
        if (!u.derniere_connexion) return false;
        const lastLogin = new Date(u.derniere_connexion);
        const daysSince = (Date.now() - lastLogin) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      }).length
    };

    container.innerHTML = `
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <p class="text-sm opacity-90 mb-1">Total</p>
          <p class="text-3xl font-bold">${stats.total}</p>
        </div>
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <p class="text-sm opacity-90 mb-1">🎓 Élèves</p>
          <p class="text-3xl font-bold">${stats.eleves}</p>
        </div>
        <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <p class="text-sm opacity-90 mb-1">💻 Devs</p>
          <p class="text-3xl font-bold">${stats.devs}</p>
        </div>
        <div class="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white">
          <p class="text-sm opacity-90 mb-1">🎨 Designers</p>
          <p class="text-3xl font-bold">${stats.designers}</p>
        </div>
        <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <p class="text-sm opacity-90 mb-1">Actifs (7j)</p>
          <p class="text-3xl font-bold">${stats.actifs}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div class="flex flex-wrap gap-3 items-center">
          <div class="flex-1 min-w-[300px]">
            <input type="text" id="searchUsers" placeholder="🔍 Rechercher par nom ou email..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
          </div>
          <select id="filterParcours" class="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
            <option value="">Tous les parcours</option>
            <option value="eleve">🎓 Élèves</option>
            <option value="dev-web">💻 Développeurs</option>
            <option value="designer">🎨 Designers</option>
          </select>
          <select id="filterActivite" class="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
            <option value="">Toute activité</option>
            <option value="actif">Actifs (7j)</option>
            <option value="inactif">Inactifs (+7j)</option>
          </select>
          <button id="exportBtn" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Exporter CSV
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Utilisateur</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Parcours</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Points</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Streak</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Inscription</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dernière connexion</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody id="usersTableBody" class="divide-y divide-gray-200">
              ${users.map(user => this.renderUserRow(user)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Add event listeners
    users.forEach(user => {
      const viewBtn = document.getElementById(`view-${user.id}`);
      const deleteBtn = document.getElementById(`delete-${user.id}`);
      
      if (viewBtn) viewBtn.addEventListener('click', () => this.viewDetails(user.id));
      if (deleteBtn) deleteBtn.addEventListener('click', () => this.delete(user.id, user.nom));
    });

    // Export button
    document.getElementById('exportBtn').addEventListener('click', () => this.exportCSV());
  }

  renderUserRow(user) {
    const parcoursConfig = PARCOURS_CONFIG[user.type_parcours] || { label: 'N/A', color: 'gray' };
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      gray: 'bg-gray-100 text-gray-800'
    };

    const lastLogin = user.derniere_connexion ? new Date(user.derniere_connexion) : null;
    const daysSinceLogin = lastLogin ? Math.floor((Date.now() - lastLogin) / (1000 * 60 * 60 * 24)) : null;
    
    let activityBadge = '';
    let activityStatus = 'inactif';
    
    if (daysSinceLogin !== null) {
      if (daysSinceLogin === 0) {
        activityBadge = '<span class="text-xs text-green-600">Aujourd\'hui</span>';
        activityStatus = 'actif';
      } else if (daysSinceLogin <= 7) {
        activityBadge = `<span class="text-xs text-green-600">Il y a ${daysSinceLogin}j</span>`;
        activityStatus = 'actif';
      } else if (daysSinceLogin <= 30) {
        activityBadge = `<span class="text-xs text-orange-600">Il y a ${daysSinceLogin}j</span>`;
      } else {
        activityBadge = '<span class="text-xs text-red-600">Inactif</span>';
      }
    } else {
      activityBadge = '<span class="text-xs text-gray-400">Jamais connecté</span>';
    }

    const initials = user.nom ? user.nom.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

    return `
      <tr class="hover:bg-gray-50 transition user-row" 
          data-nom="${(user.nom || '').toLowerCase()}" 
          data-email="${(user.email || '').toLowerCase()}" 
          data-parcours="${user.type_parcours || ''}" 
          data-activite="${activityStatus}">
        <td class="px-6 py-4">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold mr-3">
              ${initials}
            </div>
            <div>
              <p class="font-semibold text-gray-900">${user.nom || 'Sans nom'}</p>
              <p class="text-sm text-gray-500">${user.email}</p>
            </div>
          </div>
        </td>
        <td class="px-6 py-4">
          <span class="px-3 py-1 text-xs font-semibold rounded-full ${colorClasses[parcoursConfig.color]}">
            ${parcoursConfig.label}
          </span>
        </td>
        <td class="px-6 py-4">
          <span class="font-bold text-blue-600">${user.points_total || 0}</span>
        </td>
        <td class="px-6 py-4">
          <span class="flex items-center">
            <span class="text-orange-500 mr-1">🔥</span>
            <span class="font-semibold">${user.streak_jours || 0}</span>
          </span>
        </td>
        <td class="px-6 py-4 text-sm text-gray-500">
          ${ui.formatDate(user.date_inscription || user.created_at)}
        </td>
        <td class="px-6 py-4">
          <div class="flex flex-col">
            ${activityBadge}
            ${lastLogin ? `<span class="text-xs text-gray-400">${ui.formatDate(lastLogin)}</span>` : ''}
          </div>
        </td>
        <td class="px-6 py-4 text-right">
          <div class="flex justify-end space-x-2">
            <button id="view-${user.id}" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Voir détails">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </button>
            <button id="delete-${user.id}" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  setupFilters() {
    const searchInput = document.getElementById('searchUsers');
    const parcoursFilter = document.getElementById('filterParcours');
    const activiteFilter = document.getElementById('filterActivite');

    if (!searchInput) return;

    const filterUsers = () => {
      const searchTerm = searchInput.value.toLowerCase();
      const parcours = parcoursFilter.value;
      const activite = activiteFilter.value;

      document.querySelectorAll('.user-row').forEach(row => {
        const nom = row.dataset.nom || '';
        const email = row.dataset.email || '';
        const userParcours = row.dataset.parcours;
        const userActivite = row.dataset.activite;

        const matchSearch = !searchTerm || nom.includes(searchTerm) || email.includes(searchTerm);
        const matchParcours = !parcours || userParcours === parcours;
        const matchActivite = !activite || userActivite === activite;

        row.style.display = (matchSearch && matchParcours && matchActivite) ? '' : 'none';
      });
    };

    searchInput.addEventListener('input', filterUsers);
    parcoursFilter.addEventListener('change', filterUsers);
    activiteFilter.addEventListener('change', filterUsers);
  }

  async viewDetails(userId) {
    try {
      const { data: user } = await api.client.from('profiles').select('*').eq('id', userId).single();
      const { data: progressions } = await api.client.from('progressions_cours').select('*, cours(titre)').eq('user_id', userId);
      const { data: exercices } = await api.client.from('soumissions_exercices').select('*').eq('user_id', userId);

      const coursTermines = progressions?.filter(p => p.est_termine).length || 0;
      const exercicesReussis = exercices?.filter(e => e.est_reussi).length || 0;
      const tauxReussite = exercices?.length > 0 ? ((exercicesReussis / exercices.length) * 100).toFixed(1) : 0;

      const details = `
📊 Détails de ${user.nom || 'Utilisateur'}

📚 Cours terminés: ${coursTermines}
✅ Exercices réussis: ${exercicesReussis}/${exercices?.length || 0}
📈 Taux de réussite: ${tauxReussite}%
🏆 Points totaux: ${user.points_total || 0}
🔥 Streak: ${user.streak_jours || 0} jours
📧 Email: ${user.email}
📅 Inscrit le: ${ui.formatDate(user.date_inscription || user.created_at)}
🎯 Parcours: ${PARCOURS_CONFIG[user.type_parcours]?.label || 'Non défini'}
${user.bio ? `\n📝 Bio: ${user.bio}` : ''}
${user.derniere_connexion ? `\n🕐 Dernière connexion: ${ui.formatDateTime(user.derniere_connexion)}` : '\n🕐 Dernière connexion: Jamais'}
      `;

      alert(details);

    } catch (error) {
      ui.showNotification('Erreur lors du chargement des détails', 'error');
    }
  }

  async delete(userId, userName) {
    const confirmed = await ui.confirm(
      `Supprimer l'utilisateur "${userName}" ?\n\nCette action est irréversible et supprimera :\n- Toutes ses progressions\n- Tous ses exercices\n- Toutes ses données`,
      '⚠️ Suppression définitive'
    );

    if (!confirmed) return;

    try {
      await api.deleteUtilisateur(userId);
      ui.showNotification('Utilisateur supprimé avec succès');
      await this.render();
    } catch (error) {
      ui.showNotification('Erreur: ' + error.message, 'error');
    }
  }

  exportCSV() {
    try {
      const rows = Array.from(document.querySelectorAll('.user-row')).filter(row => {
        return row.style.display !== 'none';
      });

      if (rows.length === 0) {
        ui.showNotification('Aucun utilisateur à exporter', 'warning');
        return;
      }

      let csv = 'Nom,Email,Parcours,Points,Streak,Inscription,Derniere Connexion\n';

      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const nom = cells[0].querySelector('p.font-semibold')?.textContent || 'N/A';
        const email = cells[0].querySelectorAll('p')[1]?.textContent || 'N/A';
        const parcours = cells[1]?.textContent.trim() || 'N/A';
        const points = cells[2]?.textContent.trim() || '0';
        const streak = cells[3]?.querySelector('span.font-semibold')?.textContent || '0';
        const inscription = cells[4]?.textContent.trim() || 'N/A';
        const derniereConnexion = cells[5]?.textContent.trim() || 'Jamais';

        csv += `"${nom}","${email}","${parcours}","${points}","${streak}","${inscription}","${derniereConnexion}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      ui.showNotification(`✅ ${rows.length} utilisateur(s) exporté(s)`);
    } catch (error) {
      ui.showNotification('Erreur lors de l\'export', 'error');
    }
  }
}

export const utilisateursView = new UtilisateursView();