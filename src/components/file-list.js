import { listDirectory } from '../utils/file-ops.js';
import { downloadFile } from '../utils/download.js';
import { setCurrentPath } from '../utils/state.js';
import { filterItems } from './search.js';

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

const STYLES = `
    <style>
      .fl-list {
        padding: 0.25rem 0;
      }

      /* Header row */
      .fl-header {
        display: grid;
        grid-template-columns: 1fr 120px 180px 48px;
        align-items: center;
        padding: 0.5rem 1rem;
        margin: 0 0.5rem;
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--fl-text-muted, #64748b);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        border-bottom: 1px solid var(--fl-separator, rgba(148,163,184,0.12));
        user-select: none;
      }
      .fl-header-size,
      .fl-header-date {
        text-align: left;
      }

      /* File row */
      .fl-row {
        display: grid;
        grid-template-columns: 1fr 120px 180px 48px;
        align-items: center;
        padding: 0.5rem 1rem;
        margin: 0 0.5rem;
        border-radius: 8px;
        transition: background 0.15s ease;
        border-bottom: 1px solid var(--fl-separator, rgba(148,163,184,0.08));
        position: relative;
      }
      .fl-row:last-child {
        border-bottom: none;
      }
      .fl-row:hover {
        background: var(--fl-hover, rgba(148,163,184,0.08));
      }

      /* Directory rows */
      .fl-row-dir {
        cursor: pointer;
      }
      .fl-row-dir:hover {
        background: var(--fl-hover-dir, rgba(59,130,246,0.08));
      }
      .fl-row-dir:active {
        background: var(--fl-active-dir, rgba(59,130,246,0.14));
      }

      /* Name cell */
      .fl-name {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 0;
        overflow: hidden;
      }

      /* SVG icon container */
      .fl-icon-wrap {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background: var(--fl-icon-bg, rgba(148,163,184,0.08));
        transition: background 0.15s ease;
      }
      .fl-row-dir:hover .fl-icon-wrap {
        background: var(--fl-icon-bg-dir, rgba(59,130,246,0.12));
      }
      .fl-icon-svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }

      /* Icon color variants */
      .fl-icon-dir { color: var(--fl-icon-dir, #3b82f6); }
      .fl-icon-image { color: var(--fl-icon-image, #8b5cf6); }
      .fl-icon-video { color: var(--fl-icon-video, #ef4444); }
      .fl-icon-audio { color: var(--fl-icon-audio, #f59e0b); }
      .fl-icon-archive { color: var(--fl-icon-archive, #6366f1); }
      .fl-icon-code { color: var(--fl-icon-code, #10b981); }
      .fl-icon-pdf { color: var(--fl-icon-pdf, #ef4444); }
      .fl-icon-file { color: var(--fl-icon-file, #94a3b8); }

      /* Name text */
      .fl-name-link {
        color: var(--fl-text, #e2e8f0);
        text-decoration: none;
        cursor: pointer;
        background: none;
        border: none;
        font: inherit;
        font-weight: 500;
        font-size: 0.875rem;
        padding: 0;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .fl-name-link:hover {
        color: var(--fl-link, #3b82f6);
      }
      .fl-name-text {
        color: var(--fl-text, #e2e8f0);
        font-size: 0.875rem;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Size & date */
      .fl-size,
      .fl-date {
        text-align: left;
        font-size: 0.8rem;
        color: var(--fl-text-secondary, #94a3b8);
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }

      /* Download button: hidden by default, appears on row hover */
      .fl-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
      }
      .fl-btn-dl {
        opacity: 0;
        background: none;
        border: none;
        color: var(--fl-text-muted, #64748b);
        cursor: pointer;
        padding: 0.35rem;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
      }
      .fl-row:hover .fl-btn-dl {
        opacity: 1;
      }
      .fl-btn-dl:hover {
        color: var(--fl-link, #3b82f6);
        background: var(--fl-hover, rgba(148,163,184,0.12));
      }
      .fl-btn-dl svg {
        width: 18px;
        height: 18px;
      }

      /* States */
      .fl-loading {
        padding: 3rem 2rem;
        text-align: center;
        color: var(--fl-text-muted, #64748b);
        font-size: 0.875rem;
      }
      .fl-loading-spinner {
        display: inline-block;
        width: 24px;
        height: 24px;
        border: 2.5px solid var(--fl-separator, rgba(148,163,184,0.15));
        border-top-color: var(--fl-link, #3b82f6);
        border-radius: 50%;
        animation: fl-spin 0.7s linear infinite;
        margin-bottom: 0.75rem;
      }
      @keyframes fl-spin { to { transform: rotate(360deg); } }

      .fl-error {
        padding: 1rem 1.25rem;
        color: var(--fl-error-text, #fca5a5);
        background: var(--fl-error-bg, rgba(127,29,29,0.15));
        border-radius: 8px;
        margin: 1rem 0.5rem;
        font-size: 0.875rem;
        border: 1px solid var(--fl-error-border, rgba(239,68,68,0.2));
      }

      .fl-empty {
        padding: 3rem 2rem;
        text-align: center;
        color: var(--fl-text-muted, #64748b);
        font-size: 0.875rem;
      }
      .fl-empty-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 0.75rem;
        color: var(--fl-text-faint, #475569);
        opacity: 0.5;
      }

      /* Light theme */
      @media (prefers-color-scheme: light) {
        .fl-list {
          --fl-text: #1e293b;
          --fl-text-secondary: #475569;
          --fl-text-muted: #64748b;
          --fl-text-faint: #94a3b8;
          --fl-link: #2563eb;
          --fl-hover: rgba(148,163,184,0.1);
          --fl-hover-dir: rgba(37,99,235,0.06);
          --fl-active-dir: rgba(37,99,235,0.12);
          --fl-separator: rgba(148,163,184,0.15);
          --fl-icon-bg: rgba(148,163,184,0.1);
          --fl-icon-bg-dir: rgba(37,99,235,0.1);
          --fl-icon-dir: #2563eb;
          --fl-icon-image: #7c3aed;
          --fl-icon-video: #dc2626;
          --fl-icon-audio: #d97706;
          --fl-icon-archive: #4f46e5;
          --fl-icon-code: #059669;
          --fl-icon-pdf: #dc2626;
          --fl-icon-file: #64748b;
          --fl-error-text: #991b1b;
          --fl-error-bg: rgba(254,226,226,0.5);
          --fl-error-border: rgba(220,38,38,0.2);
        }
      }

      /* Dark theme */
      @media (prefers-color-scheme: dark) {
        .fl-list {
          --fl-text: #e2e8f0;
          --fl-text-secondary: #94a3b8;
          --fl-text-muted: #64748b;
          --fl-text-faint: #475569;
          --fl-link: #3b82f6;
          --fl-hover: rgba(148,163,184,0.08);
          --fl-hover-dir: rgba(59,130,246,0.08);
          --fl-active-dir: rgba(59,130,246,0.14);
          --fl-separator: rgba(148,163,184,0.08);
          --fl-icon-bg: rgba(148,163,184,0.08);
          --fl-icon-bg-dir: rgba(59,130,246,0.12);
          --fl-icon-dir: #3b82f6;
          --fl-icon-image: #8b5cf6;
          --fl-icon-video: #ef4444;
          --fl-icon-audio: #f59e0b;
          --fl-icon-archive: #6366f1;
          --fl-icon-code: #10b981;
          --fl-icon-pdf: #ef4444;
          --fl-icon-file: #94a3b8;
          --fl-error-text: #fca5a5;
          --fl-error-bg: rgba(127,29,29,0.15);
          --fl-error-border: rgba(239,68,68,0.15);
        }
      }

      @media (max-width: 640px) {
        .fl-header {
          grid-template-columns: 1fr 80px 48px;
        }
        .fl-header-date { display: none; }
        .fl-row {
          grid-template-columns: 1fr 80px 48px;
        }
        .fl-date { display: none; }
        .fl-icon-wrap {
          width: 32px;
          height: 32px;
        }
        .fl-icon-svg {
          width: 18px;
          height: 18px;
        }
      }
    </style>`;

export async function renderFileList(container, path = '/', searchQuery = '') {
  container.innerHTML = `
    ${STYLES}
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

    // Build rows with escaped content
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

      return `<div class="${rowClass}">
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
        ${STYLES}
      <div class="fl-list">
          ${viewToggle}
        <div class="fl-header">
          <div>Name</div>
          <div class="fl-header-size">Size</div>
          <div class="fl-header-date">Modified</div>
          <div></div>
        </div>
        ${rows}
      </div>
    `;

    // Event delegation for directory clicks
    container.querySelectorAll('[data-dir-path]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        setCurrentPath(el.dataset.dirPath);
      });
    });

    // Event delegation for download clicks
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
