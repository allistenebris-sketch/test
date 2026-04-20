const toast = (msg) => {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
};

const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const getRole = () => localStorage.getItem('role') || 'user';
const setRole = (role) => localStorage.setItem('role', role || 'user');
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
};

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}), ...authHeaders() };
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.detail || data.message || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = '/index.html';
  }
}

function applyRoleVisibility() {
  const isAdmin = getRole() === 'admin';
  document.querySelectorAll('.admin-only').forEach((el) => {
    el.style.display = isAdmin ? '' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', applyRoleVisibility);
