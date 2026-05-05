import { getClient } from './webdav-client.js';
import { isFileText } from './file-ops.js';

export async function uploadFile(targetPath, file) {
  const client = getClient();
  const basePath = targetPath.endsWith('/') ? targetPath : `${targetPath}/`;
  const fullPath = `${basePath}${file.name}`;

  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);

    if (isFileText(file.type, file.name)) {
      reader.readAsText(file);     // result → string; UTF-8 default encoding
    } else {
      reader.readAsArrayBuffer(file);
    }
  });

  // if (typeof data === 'string') {console.log(file.name, data);}

  const result = await client.putFileContents(
    fullPath, 
    data, 
    { overwrite: true, contentLength: true }
  );
}
