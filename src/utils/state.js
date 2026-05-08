let currentPath = '/';
let currentServer = null;
let servers = [];
let sidebarOpen = true;
let sidebarWidth = 240;
let searchQuery = '';
let viewMode = 'list';

// Version counter tracks changes to the servers list specifically.
// layout.js uses this to decide whether to re-render the sidebar.
let serversVersion = 0;

const listeners = [];

export function getState() {
  return { currentPath, viewMode, currentServer, servers, sidebarOpen, sidebarWidth, searchQuery, serversVersion };
}

export function getServersVersion() {
  return serversVersion;
}

export function setCurrentPath(path) {
  currentPath = path;
  notify();
}

export function toggleViewMode() {
  viewMode = viewMode === 'list' ? 'grid' : 'list';
}

export function setCurrentServer(server) {
  currentServer = server;
  currentPath = '/';
  notify();
}

export function addServer(server) {
  if (!servers.find(s => s.url === server.url)) {
    servers.push(server);
    serversVersion++;
    notify();
  }
}

export function removeServer(url) {
  servers = servers.filter(s => s.url !== url);
  if (currentServer?.url === url) {
    currentServer = servers[0] || null;
    currentPath = '/';
  }
  serversVersion++;
  notify();
}

export function setSidebarOpen(open) {
  sidebarOpen = open;
  notify();
}

export function setSidebarWidth(w) {
  sidebarWidth = Math.max(180, w);
  notify();
}

export function setSearchQuery(q) {
  searchQuery = q;
  notify();
}

export function subscribe(fn) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

function notify() {
  for (const fn of listeners) fn(getState());
}
