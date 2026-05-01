import { login } from '../utils/auth.js';

export function renderLogin(container, onLogin) {
  container.innerHTML = `
    <style>
      .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; }
      .login-card { background: #1e293b; padding: 2rem; border-radius: 0.75rem; box-shadow: 0 10px 25px rgba(0,0,0,0.3); width: 100%; max-width: 28rem; }
      .login-title { font-size: 1.5rem; font-weight: 700; color: #f1f5f9; margin-bottom: 1.5rem; text-align: center; }
      .login-label { display: block; font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.25rem; }
      .login-input { width: 100%; padding: 0.5rem 0.75rem; background: #334155; border: 1px solid #475569; border-radius: 0.375rem; color: #f1f5f9; }
      .login-input::placeholder { color: #64748b; }
      .login-input:focus { outline: none; border-color: #3b82f6; }
      .login-error { color: #f87171; font-size: 0.875rem; display: none; }
      .login-error.visible { display: block; }
      .login-btn { width: 100%; padding: 0.5rem; background: #2563eb; color: #fff; font-weight: 600; border-radius: 0.375rem; border: none; cursor: pointer; transition: background 0.2s; }
      .login-btn:hover { background: #1d4ed8; }
      .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .login-group { margin-bottom: 1rem; }

      @media (prefers-color-scheme: light) {
        .login-page { background: #f1f5f9; }
        .login-card { background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .login-title { color: #1e293b; }
        .login-label { color: #475569; }
        .login-input { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }
        .login-input::placeholder { color: #94a3b8; }
        .login-input:focus { border-color: #2563eb; }
        .login-error { color: #dc2626; }
        .login-btn { background: #2563eb; }
        .login-btn:hover { background: #1d4ed8; }
      }
    </style>
    <div class="login-page">
      <div class="login-card">
        <h1 class="login-title">WebDAV File Browser</h1>
        <form id="login-form">
          <div class="login-group">
            <label class="login-label" for="server-url">Server URL</label>
            <input id="server-url" type="url" required placeholder="http://localhost:8888" class="login-input">
          </div>
          <div class="login-group">
            <label class="login-label" for="username">Username</label>
            <input id="username" type="text" placeholder="username (optional)" class="login-input">
          </div>
          <div class="login-group">
            <label class="login-label" for="password">Password</label>
            <input id="password" type="password" placeholder="password (optional)" class="login-input">
          </div>
          <div id="error" class="login-error"></div>
          <button type="submit" class="login-btn">Connect</button>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');

    const url = document.getElementById('server-url').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Connecting…';

    try {
      await login(url, username, password);
      if (onLogin) onLogin();
      else container.innerHTML = '<p style="color:#4ade80;padding:2rem;">Connected.</p>';
    } catch (err) {
      errorEl.textContent = err.message || 'Connection failed';
      errorEl.classList.add('visible');
      btn.disabled = false;
      btn.textContent = 'Connect';
    }
  });
}
