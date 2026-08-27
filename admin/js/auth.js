// 登录认证模块

const TOKEN_KEY = 'admin_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function setAuthState(isAuthenticated) {
  document.body.classList.toggle('locked', !isAuthenticated);
  document.body.classList.toggle('unlocked', isAuthenticated);

  if (isAuthenticated) {
    const token = encodeURIComponent(getToken());
    const exportJson = document.getElementById('exportJson');
    const exportCsv = document.getElementById('exportCsv');
    exportJson.href = `/api/parts/export.json?token=${token}`;
    exportCsv.href = `/api/parts/export.csv?token=${token}`;
  }
}

function initAuth() {
  const loginForm = document.getElementById('loginForm');
  const loginButton = document.getElementById('loginButton');
  const logoutButton = document.getElementById('logoutButton');

  // 登录表单提交
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginButton.disabled = true;
    setLoginMessage('正在验证...');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginForm.password.value })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '密码错误');
      }

      localStorage.setItem(TOKEN_KEY, result.token);
      loginForm.password.value = '';
      setAuthState(true);
      setLoginMessage('');
      await loadParts();
    } catch (err) {
      setLoginMessage(err.message, true);
    } finally {
      loginButton.disabled = false;
    }
  });

  // 退出登录
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthState(false);
    setMessage('');
    setLoginMessage('');
    loginForm.password.focus();
  });

  document.body.classList.add('locked');
}
