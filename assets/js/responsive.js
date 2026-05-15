// RESPONSIVE SIDEBAR — UNIVERSEL KMERSCHOOL
(function() {
  function initResponsiveSidebar() {
    const sidebar = document.querySelector('.sidebar, aside.sidebar, .filter-sidebar');
    if (!sidebar) return;
    
    // Créer le backdrop si absent
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }
    
    // Fermer sidebar au clic backdrop
    backdrop.addEventListener('click', closeSidebar);
    
    // Fermer sidebar avec Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSidebar();
    });
  }
  
  window.openSidebar = function() {
    const sidebar = document.querySelector('.sidebar, aside.sidebar, .filter-sidebar, #sidebar-menu');
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (sidebar) sidebar.classList.add('open', 'active');
    // For admin sidebar:
    if (sidebar && sidebar.id === 'sidebar-menu') sidebar.classList.remove('-translate-x-full');
    
    if (backdrop) backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
  };
  
  window.closeSidebar = function() {
    const sidebars = document.querySelectorAll('.sidebar, aside.sidebar, .filter-sidebar, #sidebar-menu');
    const backdrop = document.querySelector('.sidebar-backdrop');
    sidebars.forEach(s => {
      s.classList.remove('open', 'active');
      if (s.id === 'sidebar-menu') s.classList.add('-translate-x-full');
    });
    if (backdrop) backdrop.classList.remove('show');
    document.body.style.overflow = '';
  };
  
  window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar, aside.sidebar, #sidebar-menu');
    if (!sidebar) return;
    const isOpen = sidebar.classList.contains('open') || sidebar.classList.contains('active') || !sidebar.classList.contains('-translate-x-full');
    if (isOpen) closeSidebar();
    else openSidebar();
  };
  
  document.addEventListener('DOMContentLoaded', initResponsiveSidebar);
})();
