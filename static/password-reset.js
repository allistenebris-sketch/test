async function forgotPasswordPopup() {
  try {
    const data = await api('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: document.getElementById('resetEmail').value }),
    });
    toast(data.debug_reset_token ? `Reset token: ${data.debug_reset_token}` : data.message);
  } catch (e) {
    toast(e.message);
  }
}

async function resetPasswordPopup() {
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
