// ── Elementos del DOM ──────────────────────────────────────────
const loginEmail    = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError    = document.getElementById('login-error');
const btnLogin      = document.getElementById('btn-login');

// ── Login ──────────────────────────────────────────────────────
if (btnLogin) {
  btnLogin.addEventListener('click', async () => {
    const email    = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
      showError(loginError, 'Completá todos los campos');
      return;
    }

    setLoading(btnLogin, true);
    hideError(loginError);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(loginError, data.message || 'Credenciales inválidas');
        return;
      }

      saveTokens(data.accessToken, data.refreshToken);
      redirectByRole(data.accessToken);

    } catch {
      showError(loginError, 'Error de conexión. Intentá de nuevo.');
    } finally {
      setLoading(btnLogin, false);
    }
  });
}

// ── Helpers ────────────────────────────────────────────────────

function saveTokens(accessToken, refreshToken) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function redirectByRole(accessToken) {
  const payload = JSON.parse(atob(accessToken.split('.')[1]));
  const role = payload.role;

  switch (role) {
    case 'SUPERADMIN': window.location.href = '/portal/superadmin.html'; break;
    case 'ADMIN':      window.location.href = '/portal/admin.html';      break;
    case 'CAPTAIN':    window.location.href = '/portal/captain.html';    break;
    case 'CLIENT':     window.location.href = '/portal/client.html';     break;
    default:           window.location.href = '/';
  }
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError(el) {
  el.classList.add('hidden');
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.textContent = loading ? '...' : 'Iniciar sesión';
}

// ── Si ya está logueado, redirigir ─────────────────────────────
const existingToken = localStorage.getItem('accessToken');
if (existingToken) {
  try {
    redirectByRole(existingToken);
  } catch {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}