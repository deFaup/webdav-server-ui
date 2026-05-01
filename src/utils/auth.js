import { createWebdavClient, clearClient } from './webdav-client.js';

const STORAGE_KEY = 'webdav_auth';

export function login(url, username, password) {
  const client = createWebdavClient(url, username, password);
  // Validate server is reachable
  await client.getDirectoryContents("/");

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ url, username, password }));
  return client;
}

export function logout() {
  sessionStorage.removeItem(STORAGE_KEY);
  clearClient();
}

export function restoreSession() {
  const data = sessionStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  const { url, username, password } = JSON.parse(data);
  return createWebdavClient(url, username, password);
}
