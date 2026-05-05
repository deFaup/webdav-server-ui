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

/**
 * @param {string} type // file.type is the MIME type reported by the browser
 * @param {string} name // file.name is the original filename, used as a fallback
 * @returns {boolean}
 */
export function isFileText(type, name) {
  return type.startsWith('text/') || 
    /\.(txt|csv|json|md|xml|yaml|yml|html|css|js|ts|go|java|kt|py)$/.test(name);
}
