import { listDirectory, deleteItem } from '../utils/file-ops.js';
import { downloadFile } from '../utils/download.js';
import { setCurrentPath } from '../utils/state.js';
import { filterItems } from './search.js';
import '../styles/file-view/base-styles.css';
import '../styles/file-view/list-header-styles.css';
import '../styles/file-view/grid-view-styles.css';
import '../styles/file-view/list-view-styles.css';
import '../styles/file-view/icon-styles.css';
import '../styles/file-view/action-styles.css';
import '../styles/file-view/state-styles.css';
import '../styles/file-view/context-menu.css';

// Escape HTML to prevent XSS from server-sourced filenames
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatSize(bytes) {
  if (bytes === 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getFileIcon(type, name) {
  const s = 'width="18" height="18"';
  if (type === 'directory') {
    return `<svg ${s} class="fl-icon-svg fl-icon-dir" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>`;
  }
  const ext = name.split('.').pop().toLowerCase();

  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const videoExts = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'wmv', 'flv'];
  const audioExts = ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a'];
  const archiveExts = ['zip', 'tar', 'gz', 'rar', '7z', 'bz2'];
  const codeExts = ['js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'sh'];

  if (imageExts.includes(ext)) {
    return `<svg ${s} class="fl-icon-svg fl-icon-image" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>`;
  }
  if (videoExts.includes(ext)) {
    return `<svg ${s} class="fl-icon-svg fl-icon-video" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>`;
  }
  if (audioExts.includes(ext)) {
    return `<svg ${s} class="fl-icon-svg fl-icon-audio" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>`;
  }
  if (archiveExts.includes(ext)) {
    return `<svg ${s} class="fl-icon-svg fl-icon-archive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>
    </svg>`;
  }
  if (codeExts.includes(ext)) {
    return `<svg ${s} class="fl-icon-svg fl-icon-code" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>`;
  }
  if (ext === 'pdf') {
    return `<svg ${s} class="fl-icon-svg fl-icon-pdf" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>`;
  }

  // Default file icon
  return `<svg ${s} class="fl-icon-svg fl-icon-file" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
  </svg>`;
}

let colWidthsForListView = { name: '', size: '', date: '', action: '', ghost: '' };
let colWidthsDefaults = { name: 150, size: 60 }; //px
let activeItemPath = null;
let contextMenuState = { open: false, x: 0, y: 0, item: null };
let lastRenderedPath = null;


function initResize(container) {
  const handles = container.querySelectorAll('.fl-resize-handle');
  if (colWidthsForListView['name'] === '') {
    const headerStyle = getComputedStyle(handles[0].parentElement);
    colWidthsForListView.name = headerStyle.getPropertyValue('--fl-col-name');
    colWidthsForListView.size = headerStyle.getPropertyValue('--fl-col-size');
    colWidthsForListView.date = headerStyle.getPropertyValue('--fl-col-date');
    colWidthsForListView.action = headerStyle.getPropertyValue('--fl-col-action');
    colWidthsForListView.ghost = headerStyle.getPropertyValue('--fl-col-ghost');
  }

  handles.forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const col = handle.dataset.col;
      const header = handle.closest('.fl-header');
      const startX = e.clientX;
      const startWidth = col === 'name'
        ? header.firstElementChild.getBoundingClientRect().width
        : header.children[1].getBoundingClientRect().width;

      const onMove = (ev) => {
        const delta = ev.clientX - startX;
        const newWidth = Math.max(colWidthsDefaults[col], startWidth + delta);
        colWidthsForListView[col] = newWidth + 'px';
        const cols = `${colWidthsForListView.name} ${colWidthsForListView.size} ${colWidthsForListView.date} ${colWidthsForListView.action} ${colWidthsForListView.ghost}`;
        header.style.gridTemplateColumns = cols;
        container.querySelectorAll('.fl-row').forEach(r => r.style.gridTemplateColumns = cols);
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });
}

function syncSelection(container, rootEl) {
  // remove current active
  container.querySelectorAll('.fl-row.fl-row-active, .fl-grid-item.fl-grid-item-active').forEach(el => {
    el.classList.contains('fl-row') ?
      el.classList.toggle('fl-row-active') : el.classList.toggle('fl-grid-item-active');
  });

  if (!rootEl) return;

  if (rootEl.classList.contains('fl-row')) {
    rootEl.classList.toggle('fl-row-active');
  } else if (rootEl.classList.contains('fl-grid-item')) {
    rootEl.classList.toggle('fl-grid-item-active'); //could set the second param as, path === activeItemPath
  }
}

function closeContextMenu(container) {
  contextMenuState = { open: false, x: 0, y: 0, item: null };
  container.querySelector('.fl-context-menu')?.remove();
}

function renderContextMenu(container) {
  container.querySelector('.fl-context-menu')?.remove();

  if (!contextMenuState.open || !contextMenuState.item) return;

  const item = contextMenuState.item;
  const isDir = item.type === 'directory';

  const menu = document.createElement('div');
  menu.className = 'fl-context-menu';
  menu.style.left = `${contextMenuState.x}px`;
  menu.style.top = `${contextMenuState.y}px`;
  menu.innerHTML = `
    <button class="fl-context-item" data-action="preview" ${isDir ? 'disabled' : ''}>Preview</button>
    <button class="fl-context-item" data-action="download" ${isDir ? 'disabled' : ''}>Download</button>
    <button class="fl-context-item" data-action="move" disabled>Move</button>
    <button class="fl-context-item" data-action="delete">Delete</button>
  `;

  menu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;

      if (action === 'download') {
        downloadFile(item.filename);
      } else if (action === 'delete') {
        if (confirm(`Are you sure you want to delete "${item.basename}"? This action cannot be undone.`)) {
          if (isDir) item.filename += '/'; // ensure directories end with slash for deletion
          deleteItem(item.filename).then(() => {
            // After deletion, refresh the file list
            activeItemPath = ''
            setCurrentPath(lastRenderedPath); // TODO - change this to simple renderFileList
          }).catch(err => {
            alert(`Failed to delete: ${err.message}`);
          });
        }
      }
      closeContextMenu(container);
    });
  });

  container.appendChild(menu);
}

export async function renderFileList(container, viewMode, path = '/', searchQuery = '') {
  if (path !== lastRenderedPath) {
    activeItemPath = null;
    lastRenderedPath = path;
  }

  container.innerHTML = `
    <div class="fl-list">
      <div class="fl-loading">
        <div class="fl-loading-spinner"></div>
        <div>Loading...</div>
      </div>
    </div>
  `;

  try {
    const contents = await listDirectory(path);
    let items = Array.isArray(contents) ? contents : contents.data || [];

    items.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.basename.localeCompare(b.basename);
    });

    items = filterItems(items, searchQuery);

    if (items.length === 0) {
      container.innerHTML = `
        <div class="fl-list">
          <div class="fl-empty">
            <svg class="fl-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <div>No files found</div>
          </div>
        </div>
      `;
      return;
    }

    // Download icon SVG (arrow-down-to-line)
    const dlIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

    if (viewMode === 'grid') {
      // Grid view
      const gridItems = items.map(item => {
        const icon = getFileIcon(item.type, item.basename);
        const isDir = item.type === 'directory';
        const size = item.type === 'file' ? formatSize(item.size) : '';
        // TODO - get/calculate size of directories (for now it returns 0)

        const cardClass = [
          'fl-grid-item',
          isDir ? 'fl-grid-item-dir' : '',
          activeItemPath === item.filename ? 'fl-grid-item-active' : ''
        ].filter(Boolean).join(' ');

        // TODO - this does not render in grid but works in list view
        const dlBtn = !isDir
          ? `<button class="fl-grid-dl" data-file-path="${esc(item.filename)}" aria-label="Download ${esc(item.basename)}">${dlIcon}</button>`
          : '';

        // data-dir-path added at root level of card/grid makes it navigeable
        const includeDirPathForNavigation = isDir ? `data-dir-path="${esc(item.filename)}"` : ''

        return `<div class="${cardClass}" ${includeDirPathForNavigation}>
          ${dlBtn}
          <div class="fl-grid-icon">${icon}</div>
          <div class="fl-grid-name" title="${esc(item.basename)}">${esc(item.basename)}</div>
          ${size ? `<div class="fl-grid-size">${esc(size)}</div>` : ''}
        </div>`;
      }).join('');

      container.innerHTML = `
        <div class="fl-list">
          <div class="fl-grid">${gridItems}</div>
        </div>
      `;
    } else {
      // List view
      const rows = items.map(item => {
        const icon = getFileIcon(item.type, item.basename);
        const isDir = item.type === 'directory';
        const rowClass = [
          'fl-row',
          isDir ? 'fl-row-dir' : '',
          activeItemPath === item.filename ? 'fl-row-active' : ''
        ].filter(Boolean).join(' ');

        const nameContent = isDir
          ? `<button class="fl-name-link" data-dir-path="${esc(item.filename)}">${esc(item.basename)}</button>`
          : `<span class="fl-name-text">${esc(item.basename)}</span>`;

        const size = item.type === 'file' ? formatSize(item.size) : '—';
        const date = formatDate(item.lastmod);

        const action = !isDir
          ? `<button class="fl-btn-dl" data-file-path="${esc(item.filename)}" aria-label="Download ${esc(item.basename)}">${dlIcon}</button>`
          : '';

        return `<div class="${rowClass}"}">
          <div class="fl-name">
            <div class="fl-icon-wrap">${icon}</div>
            ${nameContent}
          </div>
          <div class="fl-size">${esc(size)}</div>
          <div class="fl-date">${esc(date)}</div>
          <div class="fl-actions">${action}</div>
          <div></div>  <!-- ghost spacer -->
        </div>`;
      }).join('');

      container.innerHTML = `
        <div class="fl-list">
          <div class="fl-header">
            <div>Name<div class="fl-resize-handle" data-col="name"></div></div>
            <div class="fl-header-size">Size<div class="fl-resize-handle" data-col="size"></div></div>
            <div class="fl-header-date">Modified</div>
            <div></div>
          </div>
          ${rows}
        </div>
      `;
    }

    // Column resize
    initResize(container);

    // Close menu when clicking empty space
    container.addEventListener('click', (e) => {
      if (contextMenuState.open && !e.target.closest('.fl-context-menu')) {
        closeContextMenu(container);
      }
      // clicking empty space remove highlight (no action if no element active OR if no row/card close by)
      if (activeItemPath && !e.target.closest('.fl-row, .fl-grid-item')) {
        activeItemPath = ''
        syncSelection(container, null)
      }
    });

    // Directory / file click events
    container.querySelectorAll('[data-dir-path], [data-file-path]').forEach(el => {
      // data-dir-path or data-file-path respectively have either dataset.dirPath or dataset.filePath.
      // those dataset props are the one set after the class def for any elem
      const row = el.closest('.fl-row, .fl-grid-item');
      const itemPath = el.dataset.dirPath || el.dataset.filePath;
      const isDir = !!el.dataset.dirPath;
      const itemLabel = row?.querySelector('.fl-name-text, .fl-grid-name, .fl-name-link')?.textContent?.trim() || (itemPath ? itemPath.split('/').pop() : '');

      // navigate to next dir and dl for elements that dir buttons or dl buttons
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        activeItemPath = itemPath;
        if (isDir) {
          activeItemPath = '' // set to empty since we move to a new path
          setCurrentPath(itemPath);
        } else {
          downloadFile(itemPath);
        }
      });

      if (row) {
        row.addEventListener('click', (e) => { // could also be 'pointerdown'
          e.stopPropagation();
          if (e.target.closest('.fl-actions, .fl-btn-dl, .fl-grid-dl, .fl-context-menu, .fl-name-link')) return;
          if (e.button !== 0) return;
          activeItemPath = itemPath;
          syncSelection(container, row);
        });

        row.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          activeItemPath = itemPath;
          contextMenuState = {
            open: true,
            x: e.clientX,
            y: e.clientY,
            item: { filename: itemPath, basename: itemLabel, type: isDir ? 'directory' : 'file' }
          };
          syncSelection(container, row);
          renderContextMenu(container);
        });
      }
    });
  } catch (err) {
    container.innerHTML = `
      <div class="fl-list">
        <div class="fl-error">${esc(err.message || 'Failed to load directory')}</div>
      </div>
    `;
  }
}
