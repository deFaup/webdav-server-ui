import { restoreSession } from './utils/auth.js';
import { renderLogin } from './components/login.js';
import { renderFileList } from './components/file-list.js';

function init() {
  const app = document.getElementById('app');
  const client = restoreSession();
  if (client) {
    renderFileList(app, '/');
  } else {
    renderLogin(app, () => renderFileList(app, '/'));
  }
}

init();
