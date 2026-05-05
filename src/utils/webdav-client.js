import { createClient } from 'webdav';

let client = null;

export function getClient() {
  if (!client) throw new Error('Not connected. Log in first.');
  return client;
}

export function createWebdavClient(url, username, password) {
  const opts = {};
  if (username && password) {
    opts.authType = 'password';
    opts.username = username;
    opts.password = password;
  }
  client = createClient(url, opts);
  return client;
}

export function clearClient() {
  client = null;
}
