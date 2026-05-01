import { listDirectory } from '../utils/file-ops.js';
import { downloadFile } from '../utils/download.js';

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
  if (type === 'directory') return '📁';
  const ext = name.split('.').pop().toLowerCase();
  const icons = {
    jpg: '🖼', jpeg: '🖼', png: '🖼', gif: '🖼', webp: '🖼', svg: '🖼',
    mp4: '🎬', webm: '🎬', mkv: '🎬', avi: '🎬', mov: '🎬',
    mp3: '🎵', wav: '🎵', flac: '🎵', ogg: '🎵',
    pdf: '📄', doc: '📄', docx: '📄', txt: '📄',
    zip: '📦', tar: '📦', gz: '📦', rar: '📦',
    js: '⚙', ts: '⚙', json: '⚙', html: '⚙', css: '⚙',
  };
  return icons[ext] || '📄';
}

export async function renderFileList(container, path = '/') {
  container.innerHTML = `
    <style>
      .file-table { width: 100%; border-collapse: collapse; }
      .file-table th { text-align: left; padding: 0.5rem 0.75rem; font-size: 0.75rem; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border, #334155); }
      .file-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border, #334155); font-size: 0.875rem; }
      .file-table tr:hover { background: var(--phase-hover, #1e293b88); }
      .file-name { display: flex; align-items: center; gap: 0.5rem; }
      .file-name a { color: var(--text, #e2e8f0); text-decoration: none; }
      .file-name a:hover { color: var(--accent, #3b82f6); text-decoration: underline; }
      .file-size, .file-date { color: var(--text-secondary, #94a3b8); white-space: nowrap; }
      .file-actions { white-space: nowrap; }
      .btn-download { background: none; border: 1px solid var(--border, #334155); color: var(--text-secondary, #94a3b8); padding: 0.2rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
      .btn-download:hover { border-color: var(--accent, #3b82f6); color: var(--accent, #3b82f6); }
      .loading { padding: 2rem; text-align: center; color: var(--text-muted, #64748b); }
      .error-msg { padding: 1rem; color: #f87171; background: #7f1d1d22; border-radius: 6px; }
      .empty { padding: 2rem; text-align: center; color: var(--text-muted, #64748b); }

      @media (prefers-color-scheme: light) {
        .file-table tr:hover { background: #f1f5f9; }
        .file-name a { color: #1e293b; }
        .file-name a:hover { color: #2563eb; }
        .file-size, .file-date { color: #475569; }
        .btn-download { color: #475569; border-color: #cbd5e1; }
        .btn-download:hover { color: #2563eb; border-color: #2563eb; }
      }
    </style>
    <div class="loading">Loading…</div>
  `;

  try {
    const contents = await listDirectory(path);
    const items = Array.isArray(contents) ? contents : contents.data || [];

    if (items.length === 0) {
      container.innerHTML = '<div class="empty">Empty directory</div>';
      return;
    }

    // Sort: directories first, then by name
    items.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.basename.localeCompare(b.basename);
    });

    container.innerHTML = `
      <table class="file-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
            <th>Modified</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>
                <div class="file-name">
                  <span>${getFileIcon(item.type, item.basename)}</span>
                  ${item.type === 'directory'
                    ? `<a href="#" data-path="${item.filename}" data-type="dir">${item.basename}</a>`
                    : `<span>${item.basename}</span>`
                  }
                </div>
              </td>
              <td class="file-size">${item.type === 'file' ? formatSize(item.size) : '—'}</td>
              <td class="file-date">${formatDate(item.lastmod)}</td>
              <td class="file-actions">
                ${item.type === 'file' ? `<button class="btn-download" data-path="${item.filename}">Download</button>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Directory click handlers
    container.querySelectorAll('a[data-type="dir"]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        renderFileList(container, a.dataset.path);
      });
    });

    // Download handlers
    container.querySelectorAll('.btn-download').forEach(btn => {
      btn.addEventListener('click', () => downloadFile(btn.dataset.path));
    });

  } catch (err) {
    container.innerHTML = `<div class="error-msg">${err.message}</div>`;
  }
}
