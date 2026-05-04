import { listDirectory } from '../utils/file-ops.js';
import { downloadFile } from '../utils/download.js';
import { setCurrentPath } from '../utils/state.js';
import { filterItems } from './search.js';
import '../styles/base-styles.css';
import '../styles/header-styles.css';
import '../styles/grid-view-styles.css';
import '../styles/list-view-styles.css';
import '../styles/icon-styles.css';
import '../styles/action-styles.css';
import '../styles/state-styles.css';

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

let viewMode = 'list'; // 'list' | 'grid'
let colWidths = { name: '1fr', size: '120px' };

function getGridCols() {
  return `${colWidths.name} ${colWidths.size} 1fr 48px`;
}

function initResize(container) {
  const handles = container.querySelectorAll('.fl-resize-handle');
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
        const newWidth = Math.max(60, startWidth + delta);
        colWidths[col] = newWidth + 'px';
        const cols = getGridCols();
        container.querySelector('.fl-header').style.gridTemplateColumns = cols;
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

export async function renderFileList(container, path = '/', searchQuery = '') {
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

    const viewToggle = `
      <div class="fl-view-toggle">
        <button class="fl-view-btn${viewMode === 'list' ? ' active' : ''}" data-view="list" title="List view">☰</button>
        <button class="fl-view-btn${viewMode === 'grid' ? ' active' : ''}" data-view="grid" title="Grid view">⊞</button>
      </div>
    `;

    if (viewMode === 'grid') {
      // Grid view
      const gridItems = items.map(item => {
        const icon = getFileIcon(item.type, item.basename);
        const isDir = item.type === 'directory';
        const size = item.type === 'file' ? formatSize(item.size) : '';
        const dlBtn = !isDir
          ? `<button class="fl-grid-dl" data-file-path="${esc(item.filename)}" aria-label="Download ${esc(item.basename)}">${dlIcon}</button>`
          : '';

        return `<div class="fl-grid-item" ${isDir ? `data-dir-path="${esc(item.filename)}"` : ''}>
          ${dlBtn}
          <div class="fl-grid-icon">${icon}</div>
          <div class="fl-grid-name" title="${esc(item.basename)}">${esc(item.basename)}</div>
          ${size ? `<div class="fl-grid-meta">${esc(size)}</div>` : ''}
        </div>`;
      }).join('');

      container.innerHTML = `
        <div class="fl-list">
          ${viewToggle}
          <div class="fl-grid">${gridItems}</div>
        </div>
      `;
    } else {
      // List view
      const rows = items.map(item => {
        const icon = getFileIcon(item.type, item.basename);
        const isDir = item.type === 'directory';
        const rowClass = isDir ? 'fl-row fl-row-dir' : 'fl-row';

        const nameContent = isDir
          ? `<button class="fl-name-link" data-dir-path="${esc(item.filename)}">${esc(item.basename)}</button>`
          : `<span class="fl-name-text">${esc(item.basename)}</span>`;

        const size = item.type === 'file' ? formatSize(item.size) : '—';
        const date = formatDate(item.lastmod);

        const action = !isDir
          ? `<button class="fl-btn-dl" data-file-path="${esc(item.filename)}" aria-label="Download ${esc(item.basename)}">${dlIcon}</button>`
          : '';

        return `<div class="${rowClass}" style="grid-template-columns: ${getGridCols()}">
          <div class="fl-name">
            <div class="fl-icon-wrap">${icon}</div>
            ${nameContent}
          </div>
          <div class="fl-size">${esc(size)}</div>
          <div class="fl-date">${esc(date)}</div>
          <div class="fl-actions">${action}</div>
        </div>`;
      }).join('');

      container.innerHTML = `
        <div class="fl-list">
          ${viewToggle}
          <div class="fl-header" style="grid-template-columns: ${getGridCols()}">
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

    // View toggle events
    container.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        viewMode = btn.dataset.view;
        renderFileList(container, path, searchQuery);
      });
    });

    // Directory click events
    container.querySelectorAll('[data-dir-path]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        setCurrentPath(el.dataset.dirPath);
      });
    });

    // Download click events
    container.querySelectorAll('[data-file-path]').forEach(el => {
      el.addEventListener('click', () => downloadFile(el.dataset.filePath));
    });

  } catch (err) {
    container.innerHTML = `
      <div class="fl-list">
        <div class="fl-error">${esc(err.message || 'Failed to load directory')}</div>
      </div>
    `;
  }
}
