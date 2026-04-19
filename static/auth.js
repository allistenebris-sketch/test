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
    window.location.href = '/tracks.html';
  } catch (e) {
    toast(e.message);
  }
}

async function forgotPassword() {
  try {
    const data = await api('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: document.getElementById('email').value }),
    });
    toast(data.debug_reset_token ? `Reset token: ${data.debug_reset_token}` : data.message);
  } catch (e) {
    toast(e.message);
  }
}

async function resetPassword() {
  try {
    const data = await api('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: document.getElementById('resetToken').value,
        new_password: document.getElementById('newPassword').value,
      }),
    });
    toast(data.message);
  } catch (e) {
    toast(e.message);
  }
}
