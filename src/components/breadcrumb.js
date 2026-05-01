import { getState } from '../utils/state.js';

export function renderBreadcrumb(container, onNavigate) {
  const { currentPath } = getState();
  const parts = currentPath.split('/').filter(Boolean);

  let displayParts;
  if (parts.length <= 2) {
    displayParts = parts;
  } else {
    displayParts = ['...', parts[parts.length - 2], parts[parts.length - 1]];
  }

  // Build segments array: root + path segments
  const segments = [];

  // Root segment (home icon)
  segments.push({ label: 'home', path: '/', isHome: true, isCurrent: parts.length === 0 });

  for (let i = 0; i < displayParts.length; i++) {
    const part = displayParts[i];
    const isLast = i === displayParts.length - 1;

    let segPath;
    if (part === '...') {
      segPath = '/' + parts.slice(0, parts.length - 2).join('/');
    } else {
      const realIndex = parts.length <= 2 ? i : parts.length - 2 + i;
      segPath = '/' + parts.slice(0, realIndex + 1).join('/');
    }

    segments.push({ label: part, path: segPath, isHome: false, isCurrent: isLast });
  }

  // Build DOM safely (textContent for user data, innerHTML only for static SVG)
  container.innerHTML = '';

  const style = document.createElement('style');
  style.textContent = `
    .bc { display: flex; align-items: center; gap: 0.15rem; padding: 0.6rem 1rem; font-size: 0.8rem; color: var(--bc-text, #94a3b8); border-bottom: 1px solid var(--bc-border, #334155); flex-shrink: 0; overflow-x: auto; white-space: nowrap; }
    .bc-seg { display: inline-flex; align-items: center; gap: 0.2rem; cursor: pointer; color: var(--bc-link, #3b82f6); text-decoration: none; padding: 0.15rem 0.3rem; border-radius: 4px; transition: background 0.15s; }
    .bc-seg:hover { background: var(--bc-hover, rgba(59,130,246,0.1)); text-decoration: none; }
    .bc-seg.current { color: var(--bc-text-strong, #e2e8f0); font-weight: 600; cursor: default; }
    .bc-seg.current:hover { background: transparent; }
    .bc-sep { color: var(--bc-sep, #475569); margin: 0 0.1rem; font-size: 0.75rem; }
    .bc-home-icon { width: 14px; height: 14px; flex-shrink: 0; }

    @media (prefers-color-scheme: light) {
      .bc { --bc-text: #475569; --bc-border: #e2e8f0; --bc-link: #2563eb; --bc-hover: rgba(37,99,235,0.08); --bc-text-strong: #1e293b; --bc-sep: #94a3b8; }
    }
    @media (prefers-color-scheme: dark) {
      .bc { --bc-text: #94a3b8; --bc-border: #334155; --bc-link: #3b82f6; --bc-hover: rgba(59,130,246,0.1); --bc-text-strong: #e2e8f0; --bc-sep: #475569; }
    }
  `;
  container.appendChild(style);

  const nav = document.createElement('div');
  nav.className = 'bc';

  segments.forEach((seg, idx) => {
    // Separator
    if (idx > 0) {
      const sep = document.createElement('span');
      sep.className = 'bc-sep';
      sep.textContent = '/';
      nav.appendChild(sep);
    }

    // Segment
    const el = document.createElement('span');
    el.className = 'bc-seg' + (seg.isCurrent ? ' current' : '');

    if (seg.isHome) {
      // Home icon (SVG — static markup, no user data)
      el.innerHTML = `<svg class="bc-home-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
    } else {
      el.textContent = seg.label;
    }

    if (!seg.isCurrent) {
      el.dataset.path = seg.path;
      el.addEventListener('click', () => onNavigate(seg.path));
    }

    nav.appendChild(el);
  });

  container.appendChild(nav);
}
