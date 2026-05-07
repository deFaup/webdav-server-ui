import { setSearchQuery, setSidebarOpen, getState } from '../utils/state.js';
import '../styles/header-styles.css';

export function renderHeader(container) {
  container.innerHTML = `
    <div class="header">
      <button class="header-toggle" id="sidebar-toggle" title="Toggle sidebar">☰</button>
      <span class="header-logo">WebDAV</span>
      <div class="header-search">
        <input type="text" id="search-input" placeholder="Search files...">
      </div>
      <div class="header-right">
        <button class="header-logout" id="logout-btn">Logout</button>
      </div>
    </div>
  `;

  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    const state = getState();
    setSidebarOpen(!state.sidebarOpen);
  });

  document.getElementById('search-input').addEventListener('input', (e) => {
    setSearchQuery(e.target.value.trim());
  });

  return container;
}
