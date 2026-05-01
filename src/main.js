import { restoreSession } from './utils/auth.js';
import { renderLogin } from './components/login.js';

function init() {
  const app = document.getElementById('app');
  const client = restoreSession();
  if (client) {
    app.innerHTML = '<p>Session restored. File browser coming soon.</p>';
  } else {
    renderLogin(app);
  }
}

init();
