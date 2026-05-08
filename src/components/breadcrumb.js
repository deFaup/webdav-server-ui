import { getState, toggleViewMode } from '../utils/state.js';
import { renderFileList } from './file-list.js';
import '../styles/breadcrumb-styles.css';

export function renderBreadcrumb(container, onNavigate) {
  const { currentPath, viewMode } = getState();
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

  const bar = document.createElement('div');   // ← new outer wrapper
  bar.className = 'bc-bar';

  const nav = document.createElement('div');
  nav.className = 'bc';

  // Create path container for segments
  const pathContainer = document.createElement('div');
  pathContainer.className = 'bc-path';

  segments.forEach((seg, idx) => {
    // Separator
    if (idx > 0) {
      const sep = document.createElement('span');
      sep.className = 'bc-sep';
      sep.textContent = '/';
      pathContainer.appendChild(sep);
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

    pathContainer.appendChild(el);
  });
  nav.appendChild(pathContainer);

  bar.appendChild(nav); // path bar goes in first

  // view toggle to switch between list and griew view
  const toggleContainer = document.createElement('div');
  toggleContainer.className = 'bc-view-toggle';
  toggleContainer.innerHTML = `
    <button class="bc-view-btn${viewMode === 'list' ? ' active' : ''}" data-view="list" title="List view">☰</button>
    <button class="bc-view-btn${viewMode === 'grid' ? ' active' : ''}" data-view="grid" title="Grid view">⊞</button>
  `;
  // place it at the right of the path container
  bar.appendChild(toggleContainer);

  container.appendChild(bar);
  setupViewToggleEvents(container);
}

// TODO - rename "data-view" to show clear position and role
function setupViewToggleEvents(breadCrumbContainer) {
  breadCrumbContainer.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.classList.contains('active')) { // current view style selected -> nothing to do
        return;
      } else {
        btn.classList.add('active');
        const sibling = btn.nextElementSibling || btn.previousElementSibling;
        sibling.classList.remove('active');

        toggleViewMode();
        const state = getState();
        renderFileList(breadCrumbContainer.parentElement.querySelector('.app-content'), state.viewMode, state.currentPath, state.searchQuery);
      }
    });
  });
}
