import { getState, subscribe, getServersVersion, setCurrentPath } from '../utils/state.js';
import { logout } from '../utils/auth.js';
import { renderHeader } from './header.js';
import { renderSidebar, setupSidebarEvents, clearDirCache } from './sidebar.js';
import { renderBreadcrumb } from './breadcrumb.js';
import { renderFileList } from './file-list.js';
import { uploadFile } from '../utils/upload.js';

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

  let uploadStateEl = null;

  function ensureUploadState() {
    if (uploadStateEl) return uploadStateEl;
    uploadStateEl = document.createElement('div');
    uploadStateEl.style.padding = '0.75rem 0 0.25rem';
    contentEl.parentElement.insertBefore(uploadStateEl, contentEl);
    return uploadStateEl;
  }

  function setUploadMessage(html) {
    const el = ensureUploadState();
    el.innerHTML = html || '';
  }

  function renderUploadList(items) {
    if (!items.length) {
      setUploadMessage('');
      return;
    }

    const rows = items.map(item => `
      <div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;border-bottom:1px solid var(--border, #334155);">
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.85rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.name}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary, #94a3b8);">${item.status}</div>
        </div>
        <div style="width:120px;height:8px;border-radius:999px;background:var(--border, #334155);overflow:hidden;">
          <div style="height:100%;width:${item.progress}%;background:var(--accent, #3b82f6);"></div>
        </div>
        <div style="width:42px;text-align:right;font-size:0.75rem;color:var(--text-secondary, #94a3b8);">${item.progress}%</div>
      </div>
    `).join('');

    setUploadMessage(`
      <div style="background:var(--surface, #1e293b);border:1px solid var(--border, #334155);border-radius:8px;padding:0.75rem 1rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
          <strong style="font-size:0.85rem;">Uploading</strong>
          <span style="font-size:0.75rem;color:var(--text-secondary, #94a3b8);">${items.length} file(s)</span>
        </div>
        ${rows}
      </div>
    `);
  }

  function addEventListenersForDragAndDrop(container) {
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      // hint to browser this is a copy/drop operation
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      container.style.outline = '2px dashed var(--accent, #3b82f6)';
      container.style.outlineOffset = '-6px';
    });

    container.addEventListener('dragleave', () => {
      container.style.outline = 'none';
    });

    container.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.style.outline = 'none';

      const files = Array.from(e.dataTransfer?.files || []);

      if (files.length === 0 && e.dataTransfer?.items && e.dataTransfer.items.length) {
        // Fallback for some browsers/environments: read items and convert to File
        for (let i = 0; i < dt.items.length; i++) {
          const item = dt.items[i];
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) files.push(file);
          }
        }
      }

      if (files.length) await handleUpload(files);
    });
  }

  async function handleUpload(files) {
    const state = getState();
    if (!state.currentServer) {
      setUploadMessage(`<div style="color:#fca5a5;font-size:0.8rem;">Connect first, then upload.</div>`);
      return;
    }

    const uploads = files.map(file => ({ name: file.name, progress: 0, status: 'Queued' }));
    renderUploadList(uploads);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      uploads[i].status = 'Uploading';
      renderUploadList(uploads);
      try {
        await uploadFile(state.currentPath, file);
        uploads[i].status = 'Done';
        uploads[i].progress = 100;
        renderUploadList(uploads);
      } catch (err) {
        uploads[i].status = 'Failed';
        renderUploadList(uploads);
        setUploadMessage(`<div style="color:#fca5a5;font-size:0.8rem;padding:0.25rem 0;">Upload failed: ${err.message || 'unknown error'}</div>`);
        return;
      }
    }

    setUploadMessage(`<div style="color:var(--green-text, #6ee7b7);font-size:0.8rem;">Upload complete.</div>`);
    refreshContent();
  }

  function refreshContent() {
    const state = getState();
    renderBreadcrumb(breadcrumbEl, navigateTo);
    renderFileList(contentEl, state.currentPath, state.searchQuery);
  }

  // Header
  renderHeader(headerEl, {
    onAddFile: () => {
      const existing = container.querySelector('#upload-picker');
      if (existing) existing.remove();

      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.id = 'upload-picker';
      input.style.display = 'none';
      input.addEventListener('change', async () => {
        const files = Array.from(input.files || []);
        input.remove();
        if (!files.length) return;
        await handleUpload(files);
      });
      container.appendChild(input);
      input.click();
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

  const dropTarget = container.querySelector('.app-content');
  addEventListenersForDragAndDrop(dropTarget);
}
