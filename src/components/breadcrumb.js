import { getState } from '../utils/state.js';
import '../styles/breadcrumb-styles.css';

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
