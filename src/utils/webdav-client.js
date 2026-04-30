import { createClient } from 'webdav';

let client = null;

export function getClient() {
  return client;
}

export function createWebdavClient(url, username, password) {
  client = createClient(url, {
    authType: 'Basic',
    username,
    password,
  });
  return client;
}

export function clearClient() {
  client = null;
}
