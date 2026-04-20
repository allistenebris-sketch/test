async function register() {
  try {
    const data = await api('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        display_name: document.getElementById('displayName').value,
      }),
    });
    toast(data.debug_code ? `Код подтверждения: ${data.debug_code}` : data.message);
  } catch (e) {
    toast(e.message);
  }
}

async function verifyEmail() {
  try {
    const data = await api('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('email').value,
        code: document.getElementById('verifyCode').value,
      }),
    });
    toast(data.message);
  } catch (e) {
    toast(e.message);
  }
}

async function resendCode() {
  try {
    const data = await api('/api/auth/resend-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: document.getElementById('email').value }),
    });
    toast(data.debug_code ? `Новый код: ${data.debug_code}` : data.message);
  } catch (e) {
    toast(e.message);
  }
}

async function login() {
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
      }),
    });
    setToken(data.access_token);
    setRole(data.user.role);
    window.location.href = '/tracks.html';
  } catch (e) {
    toast(e.message);
  }
}

function openPasswordWindow() {
  window.open('/password-reset.html', 'slfox-reset', 'width=520,height=620,resizable=yes');
}
