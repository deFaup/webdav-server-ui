import { getClient } from './webdav-client.js';

function requireClient() {
  const client = getClient();
  if (!client) throw new Error('Not connected. Log in first.');
  return client;
}

export async function listDirectory(path = '/') {
  const client = requireClient();
  return client.getDirectoryContents(path);
}

export async function getFileStats(path) {
  const client = requireClient();
  return client.stat(path);
}

export async function deleteItem(path) {
  const client = requireClient();
  return client.deleteFile(path);
}
