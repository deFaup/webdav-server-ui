import { getClient } from './webdav-client.js';

export async function listDirectory(path = '/') {
  const client = getClient();
  return client.getDirectoryContents(path);
}

export async function getFileStats(path) {
  const client = getClient();
  return client.stat(path);
}

export async function deleteItem(path) {
  const client = getClient();
  return client.deleteFile(path);
}
