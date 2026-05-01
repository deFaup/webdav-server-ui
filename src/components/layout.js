import { getState, subscribe, getServersVersion, setCurrentPath } from '../utils/state.js';
import { logout } from '../utils/auth.js';
import { renderHeader } from './header.js';
import { renderSidebar, setupSidebarEvents, clearDirCache } from './sidebar.js';
import { renderBreadcrumb } from './breadcrumb.js';
import { renderFileList } from './file-list.js';

export function renderLayout(container) {
  container.innerHTML = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { height: 100%; }
      .app-layout { display: flex; flex-direction: column; height: 100vh; background: var(--layout-bg, #0f172a); color: var(--layout-text, #e2e8f0); }
      .app-header { flex-shrink: 0; }
      .app-body { display: flex; flex: 1; overflow: hidden; }
      .app-sidebar { flex-shrink: 0; position: relative; overflow: hidden; transition: width 0.2s ease; }
      .app-sidebar.closed { width: 0 !important; overflow: hidden; }
      .app-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; padding: 0 1.5rem; }
      .app-breadcrumb { flex-shrink: 0; }
      .app-content { flex: 1; overflow-y: auto; padding: 0; }

      @media (prefers-color-scheme: light) {
        .app-layout { --layout-bg: #f8fafc; --layout-text: #1e293b; }
      }
      @media (prefers-color-scheme: dark) {
        .app-layout { --layout-bg: #0f172a; --layout-text: #e2e8f0; }
      }
    </style>
    <div class="app-layout">
      <div class="app-header" id="app-header"></div>
      <div class="app-body">
        <div class="app-sidebar" id="app-sidebar"></div>
        <div class="app-main">
          <div class="app-breadcrumb" id="app-breadcrumb"></div>
          <div class="app-content" id="app-content"></div>
        </div>
      </div>
    </div>
  `;

  const headerEl = container.querySelector('#app-header');
  const sidebarEl = container.querySelector('#app-sidebar');
  const breadcrumbEl = container.querySelector('#app-breadcrumb');
  const contentEl = container.querySelector('#app-content');

  function navigateTo(path) {
    setCurrentPath(path);
  }

  function refreshContent() {
    const state = getState();
    renderBreadcrumb(breadcrumbEl, navigateTo);
    renderFileList(contentEl, state.currentPath, state.searchQuery);
  }

  // Header
  renderHeader(headerEl, {
    onAddFile: () => {
      // Phase 4 — placeholder
      alert('Upload coming in Phase 4');
    }
  });

  // Logout button
  document.getElementById('logout-btn').addEventListener('click', () => {
    logout();
    clearDirCache();
    location.reload();
  });

  // Sidebar — initial render
  renderSidebar(sidebarEl);
  setupSidebarEvents(sidebarEl, { onNavigate: navigateTo });

  // Initial content
  refreshContent();

  // Track serversVersion to only re-render sidebar when server list changes
  let lastServersVersion = getServersVersion();

  // Subscribe to state changes
  subscribe((state) => {
    // Sidebar visibility toggle
    sidebarEl.classList.toggle('closed', !state.sidebarOpen);
    if (state.sidebarOpen) {
      sidebarEl.style.width = state.sidebarWidth + 'px';
    }

    // Only re-render sidebar when servers list changes
    const currentVersion = getServersVersion();
    if (currentVersion !== lastServersVersion) {
      lastServersVersion = currentVersion;
      renderSidebar(sidebarEl);
      setupSidebarEvents(sidebarEl, { onNavigate: navigateTo });
    }

    // Refresh content on path or search change
    refreshContent();
  });

  // Apply initial sidebar width
  const state = getState();
  sidebarEl.style.width = state.sidebarWidth + 'px';
}
