import { restoreSession } from './utils/auth.js';
import { renderLogin } from './components/login.js';
import { renderLayout } from './components/layout.js';
import { addServer, setCurrentServer } from './utils/state.js';

function init() {
  const app = document.getElementById('app');
  const client = restoreSession();

  if (client) {
    // Restore server from session
    const data = JSON.parse(sessionStorage.getItem('webdav_auth'));
    addServer({ name: data.url, url: data.url, username: data.username, password: data.password });
    setCurrentServer({ url: data.url, username: data.username, password: data.password });
    renderLayout(app);
  } else {
    renderLogin(app, () => {
      const data = JSON.parse(sessionStorage.getItem('webdav_auth'));
      addServer({ name: data.url, url: data.url, username: data.username, password: data.password });
      setCurrentServer({ url: data.url, username: data.username, password: data.password });
      renderLayout(app);
    });
  }
}

init();
