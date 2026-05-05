import { getClient } from './webdav-client.js';
import { isFileText } from './file-ops.js';

export async function downloadFile(path) {
  const client = getClient();
  const response = await client.getFileContents(path);
  const blob = new Blob([response]);
  const url = URL.createObjectURL(blob);
  const filename = path.split('/').filter(Boolean).pop();

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
