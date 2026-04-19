requireAuth();

async function toggleSubscribe(id) {
  try {
    const data = await api(`/api/authors/${id}/subscribe`, { method: 'POST' });
    toast(data.message);
    await loadAuthors();
  } catch (e) {
    toast(e.message);
  }
}

async function loadAuthors() {
  try {
    const authors = await api('/api/authors');
    const root = document.getElementById('authorsList');
    root.innerHTML = '';

    for (const a of authors) {
      const div = document.createElement('div');
      div.className = 'author';
      div.innerHTML = `<strong>${a.display_name}</strong> (${a.email})`;

      const btn = document.createElement('button');
      btn.textContent = a.subscribed ? 'Отписаться' : 'Подписаться';
      btn.onclick = () => toggleSubscribe(a.id);

      div.appendChild(btn);
      root.appendChild(div);
    }
  } catch (e) {
    toast(e.message);
  }
}

loadAuthors();
