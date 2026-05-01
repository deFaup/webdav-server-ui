import { getState, setCurrentPath, setCurrentServer, setSidebarWidth, addServer } from '../utils/state.js';
import { createWebdavClient } from '../utils/webdav-client.js';
import { getClient } from '../utils/webdav-client.js';

// Directory listing cache (persists across sidebar re-renders)
const dirCache = new Map();

async function listDirs(path) {
  if (dirCache.has(path)) return dirCache.get(path);
  const client = getClient();
  if (!client) return [];
  try {
    const contents = await client.getDirectoryContents(path);
    const items = Array.isArray(contents) ? contents : contents.data || [];
    const dirs = items.filter(i => i.type === 'directory');
    dirCache.set(path, dirs);
    return dirs;
  } catch {
    return [];
  }
}

export function clearDirCache() {
  dirCache.clear();
}

// --- Escape HTML to prevent XSS from server filenames ---
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Track which paths are expanded (persists across re-renders)
const expandedPaths = new Set();

// Expand all ancestor directories of a path in the sidebar tree
function expandPathInTree(sidebarContent, targetPath) {
  const parts = targetPath.split('/').filter(Boolean);
  let current = '';
  for (const part of parts) {
    current += '/' + part;
    const chevron = sidebarContent.querySelector(`.sb-tree-chevron[data-toggle-path="${current}"]`);
    const children = sidebarContent.querySelector(`.sb-tree-children[data-parent="${current}"]`);
    if (chevron && children) {
      expandedPaths.add(current);
      chevron.textContent = '▼';
      children.style.display = 'block';
    }
  }
}

export function renderSidebar(container) {
  const state = getState();

  container.innerHTML = `
    <style>
      .sb { display: flex; flex-direction: column; height: 100%; background: var(--sb-bg, #1e293b); border-right: 1px solid var(--sb-border, #334155); overflow: hidden; }
      .sb-content { flex: 1; overflow-y: auto; padding: 0.5rem 0; }
      .sb-server { margin-bottom: 0.25rem; }
      .sb-server-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.85rem; color: var(--sb-text-muted, #94a3b8); user-select: none; }
      .sb-server-header:hover { background: var(--sb-hover, rgba(30,41,59,0.5)); }
      .sb-server-header.active { color: var(--sb-text, #e2e8f0); font-weight: 600; }
      .sb-server-chevron { font-size: 0.6rem; width: 1rem; text-align: center; cursor: pointer; flex-shrink: 0; }
      .sb-server-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
      .sb-tree { padding-left: 1rem; }
      .sb-tree-row { display: flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.75rem; font-size: 0.8rem; color: var(--sb-text-muted, #94a3b8); }
      .sb-tree-row:hover { background: var(--sb-hover, rgba(30,41,59,0.5)); }
      .sb-tree-row.active-path { color: var(--sb-text, #e2e8f0); font-weight: 500; }
      .sb-tree-chevron { font-size: 0.5rem; width: 0.8rem; text-align: center; cursor: pointer; flex-shrink: 0; padding: 0.15rem 0; }
      .sb-tree-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; padding: 0.15rem 0; }
      .sb-tree-children { padding-left: 1rem; display: none; }
      .sb-loading, .sb-empty { padding: 0.3rem 0.75rem; font-size: 0.75rem; color: var(--sb-text-faint, #64748b); }
      .sb-add { padding: 0.5rem 0.75rem; border-top: 1px solid var(--sb-border, #334155); flex-shrink: 0; }
      .sb-add-btn { width: 100%; padding: 0.4rem; background: none; border: 1px dashed var(--sb-border, #334155); color: var(--sb-text-muted, #64748b); border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: border-color 0.2s, color 0.2s; }
      .sb-add-btn:hover { border-color: var(--sb-accent, #3b82f6); color: var(--sb-accent, #3b82f6); }
      .sb-resize { width: 4px; cursor: col-resize; background: transparent; position: absolute; top: 0; right: 0; bottom: 0; transition: background 0.15s; }
      .sb-resize:hover { background: var(--sb-accent, #3b82f6); }

      @media (prefers-color-scheme: light) {
        .sb { --sb-bg: #ffffff; --sb-border: #e2e8f0; --sb-text: #1e293b; --sb-text-muted: #475569; --sb-text-faint: #94a3b8; --sb-hover: #f1f5f9; --sb-accent: #2563eb; }
      }
      @media (prefers-color-scheme: dark) {
        .sb { --sb-bg: #1e293b; --sb-border: #334155; --sb-text: #e2e8f0; --sb-text-muted: #94a3b8; --sb-text-faint: #64748b; --sb-hover: rgba(30,41,59,0.5); --sb-accent: #3b82f6; }
      }
    </style>
    <div class="sb">
      <div class="sb-content" id="sb-content"></div>
      <div class="sb-add">
        <button class="sb-add-btn" id="sb-add-server">+ Add Server</button>
      </div>
      <div class="sb-resize" id="sb-resize"></div>
    </div>
  `;

  const content = container.querySelector('#sb-content');
  const currentPath = state.currentPath;

  // Render server entries
  for (const server of state.servers) {
    renderServerEntry(content, server, server.url === state.currentServer?.url, currentPath);
  }

  // Add server button
  container.querySelector('#sb-add-server').addEventListener('click', () => {
    const name = prompt('Server name:');
    const url = prompt('Server URL:');
    if (url) {
      addServer({ name: name || url, url, username: '', password: '' });
    }
  });

  // Resize handle
  const resizeHandle = container.querySelector('#sb-resize');
  let startX, startWidth;
  resizeHandle.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    startWidth = container.offsetWidth;
    const onMove = (e2) => {
      const diff = e2.clientX - startX;
      setSidebarWidth(startWidth + diff);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

function renderServerEntry(container, server, isActive, currentPath) {
  // Defensive expand: always expand the active server's tree by default.
  // This ensures the tree is visible when switching servers.
  if (isActive) {
    expandedPaths.add('__server__' + server.url);
  }

  const isServerRootExpanded = expandedPaths.has('__server__' + server.url);
  const el = document.createElement('div');
  el.className = 'sb-server';
  el.innerHTML = `
    <div class="sb-server-header${isActive ? ' active' : ''}">
      <span class="sb-server-chevron" data-server-toggle="${server.url}">${isServerRootExpanded ? '▼' : '▶'}</span>
      <span class="sb-server-name" data-server-nav="${server.url}">${esc(server.name || server.url)}</span>
    </div>
    <div class="sb-tree" id="sb-tree-${CSS.escape(server.url)}" style="${isServerRootExpanded ? '' : 'display:none'}"></div>
  `;
  container.appendChild(el);

  const tree = el.querySelector('.sb-tree');

  // If this server's root was expanded, load its tree
  if (isServerRootExpanded) {
    renderTreeLevel(tree, '/', server, currentPath);
  }
}

async function renderTreeLevel(container, path, server, currentPath) {
  const dirs = await listDirs(path);
  container.innerHTML = '';

  if (dirs.length === 0) {
    container.innerHTML = '<div class="sb-empty">No folders</div>';
    return;
  }

  for (const dir of dirs) {
    const isExpanded = expandedPaths.has(dir.filename);
    const isActivePath = currentPath === dir.filename;

    const el = document.createElement('div');
    el.className = 'sb-tree-item';
    el.innerHTML = `
      <div class="sb-tree-row${isActivePath ? ' active-path' : ''}">
        <span class="sb-tree-chevron" data-toggle-path="${esc(dir.filename)}">${isExpanded ? '▼' : '▶'}</span>
        <span class="sb-tree-name" data-nav-path="${esc(dir.filename)}">${esc(dir.basename)}</span>
      </div>
      <div class="sb-tree-children" data-parent="${esc(dir.filename)}" style="${isExpanded ? '' : 'display:none'}"></div>
    `;
    container.appendChild(el);

    // If expanded, render children
    if (isExpanded) {
      const childrenEl = el.querySelector('.sb-tree-children');
      await renderTreeLevel(childrenEl, dir.filename, server, currentPath);
    }
  }
}

// Event delegation for sidebar interactions
export function setupSidebarEvents(sidebarEl, { onNavigate }) {
  // Guard: only attach listeners once per sidebar element.
  // layout.js may call this multiple times (initial render + server list changes).
  // Without this guard, duplicate listeners fire on each click.
  if (sidebarEl.dataset.sidebarEventsAttached) return;
  sidebarEl.dataset.sidebarEventsAttached = 'true';
  sidebarEl.addEventListener('click', async (e) => {
    // --- Server chevron toggle (expand/collapse root tree) ---
    const serverToggle = e.target.closest('[data-server-toggle]');
    if (serverToggle) {
      e.stopPropagation();
      const url = serverToggle.dataset.serverToggle;
      const key = '__server__' + url;
      const tree = sidebarEl.querySelector(`#sb-tree-${CSS.escape(url)}`);
      if (!tree) return;

      if (expandedPaths.has(key)) {
        expandedPaths.delete(key);
        serverToggle.textContent = '▶';
        tree.style.display = 'none';
      } else {
        expandedPaths.add(key);
        serverToggle.textContent = '▼';
        tree.style.display = '';
        // Load tree if empty
        if (tree.children.length === 0) {
          tree.innerHTML = '<div class="sb-loading">Loading...</div>';
          const state = getState();
          const server = state.servers.find(s => s.url === url);
          if (server) {
            await renderTreeLevel(tree, '/', server, state.currentPath);
          }
        }
      }
      return;
    }

    // --- Server name click (navigate to server root) ---
    const serverNav = e.target.closest('[data-server-nav]');
    if (serverNav) {
      const url = serverNav.dataset.serverNav;
      const state = getState();
      const server = state.servers.find(s => s.url === url);
      if (server) {
        // CRITICAL: Set expandedPaths BEFORE calling setCurrentServer.
        // setCurrentServer triggers notify() -> subscribe callback -> renderSidebar,
        // which rebuilds the DOM. expandedPaths must be set first so the new DOM
        // is built with the tree expanded.
        expandedPaths.add('__server__' + url);
        setCurrentServer(server);
        // No need to call onNavigate('/') — setCurrentServer already resets
        // currentPath to '/' and triggers notify() which refreshes content.
      }
      return;
    }

    // --- Tree chevron toggle (expand/collapse directory) ---
    const treeChevron = e.target.closest('[data-toggle-path]');
    if (treeChevron) {
      e.stopPropagation();
      const dirPath = treeChevron.dataset.togglePath;
      const childrenEl = sidebarEl.querySelector(`[data-parent="${dirPath}"]`);
      if (!childrenEl) return;

      if (expandedPaths.has(dirPath)) {
        expandedPaths.delete(dirPath);
        treeChevron.textContent = '▶';
        childrenEl.style.display = 'none';
      } else {
        expandedPaths.add(dirPath);
        treeChevron.textContent = '▼';
        childrenEl.style.display = '';
        // Load children if empty
        if (childrenEl.children.length === 0) {
          childrenEl.innerHTML = '<div class="sb-loading">Loading...</div>';
          const state = getState();
          const server = state.servers.find(s => s.url === state.currentServer?.url);
          if (server) {
            await renderTreeLevel(childrenEl, dirPath, server, state.currentPath);
          }
        }
      }
      return;
    }

    // --- Tree name click (navigate to directory, update file list + breadcrumb) ---
    const treeName = e.target.closest('[data-nav-path]');
    if (treeName) {
      const dirPath = treeName.dataset.navPath;
      // Expand ancestors in tree so the target is visible
      expandPathInTree(sidebarEl, dirPath);
      onNavigate(dirPath);
      return;
    }
  });
}
