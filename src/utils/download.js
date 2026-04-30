import { getClient } from './webdav-client.js';

function requireClient() {
  const client = getClient();
  if (!client) throw new Error('Not connected. Log in first.');
  return client;
}

export async function downloadFile(path) {
  const client = requireClient();
  const response = await client.getFileContents(path, { format: 'arraybuffer' });
  const blob = new Blob([response]);
  const url = URL.createObjectURL(blob);
  const filename = path.split('/').filter(Boolean).pop();

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
