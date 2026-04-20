requireAuth();

if (getRole() !== 'admin') {
  window.location.href = '/tracks.html';
}

async function loadOverview() {
  try {
    const data = await api('/api/admin/overview');
    document.getElementById('overview').innerHTML = `
      <p>👥 Пользователи: <strong>${data.users_count}</strong></p>
      <p>🎵 Треки: <strong>${data.tracks_count}</strong></p>
      <p>⭐ Подписки: <strong>${data.subscriptions_count}</strong></p>
    `;
  } catch (e) {
    toast(e.message);
  }
}

async function updateRole(userId, role) {
  try {
    const data = await api(`/api/admin/users/${userId}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    toast(data.message);
    await loadUsers();
  } catch (e) {
    toast(e.message);
  }
}

async function loadUsers() {
  try {
    const users = await api('/api/admin/users');
    const root = document.getElementById('usersAdmin');
    root.innerHTML = '';

    users.forEach((user) => {
      const card = document.createElement('div');
      card.className = 'author';
      card.innerHTML = `
        <strong>${user.display_name}</strong> (${user.email})<br>
        <small>Роль: ${user.role} • Подтвержден: ${user.is_verified ? 'да' : 'нет'}</small>
      `;

      const controls = document.createElement('div');
      controls.className = 'row';

      const toUser = document.createElement('button');
      toUser.textContent = 'Сделать user';
      toUser.onclick = () => updateRole(user.id, 'user');

      const toAdmin = document.createElement('button');
      toAdmin.textContent = 'Сделать admin';
      toAdmin.onclick = () => updateRole(user.id, 'admin');

      controls.appendChild(toUser);
      controls.appendChild(toAdmin);
      card.appendChild(controls);
      root.appendChild(card);
    });
  } catch (e) {
    toast(e.message);
  }
}

Promise.all([loadOverview(), loadUsers()]);
