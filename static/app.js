let token = null;

const toast = (msg) => {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
};

const headers = () => token ? { 'Authorization': `Bearer ${token}` } : {};

async function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const display_name = document.getElementById('displayName').value;

  const r = await fetch('/api/auth/register', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, password, display_name })
  });
  const data = await r.json();
  toast(data.debug_code ? `Код подтверждения: ${data.debug_code}` : data.detail || data.message);
}

async function verifyEmail() {
  const email = document.getElementById('email').value;
  const code = document.getElementById('verifyCode').value;
  const r = await fetch('/api/auth/verify', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, code })
  });
  const data = await r.json();
  toast(data.message || data.detail);
}

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const r = await fetch('/api/auth/login', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, password })
  });
  const data = await r.json();
  if (!r.ok) return toast(data.detail);

  token = data.access_token;
  document.getElementById('userInfo').textContent = `Вы вошли как ${data.user.display_name}`;
  document.getElementById('uploadSection').classList.remove('hidden');
  document.getElementById('authorsSection').classList.remove('hidden');
  document.getElementById('tracksSection').classList.remove('hidden');
  document.getElementById('playerToolbar').classList.remove('hidden');

  await Promise.all([loadTracks(), loadAuthors()]);
  toast('Успешный вход');
}

async function forgotPassword() {
  const email = document.getElementById('email').value;
  const r = await fetch('/api/auth/forgot-password', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email })
  });
  const data = await r.json();
  toast(data.debug_reset_token ? `Reset token: ${data.debug_reset_token}` : data.message);
}

async function resetPassword() {
  const tokenValue = document.getElementById('resetToken').value;
  const new_password = document.getElementById('newPassword').value;

  const r = await fetch('/api/auth/reset-password', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ token: tokenValue, new_password })
  });
  const data = await r.json();
  toast(data.message || data.detail);
}

async function uploadTrack() {
  const fd = new FormData();
  fd.append('title', document.getElementById('trackTitle').value);
  fd.append('artist_name', document.getElementById('trackArtist').value);
  fd.append('file', document.getElementById('trackFile').files[0]);

  const r = await fetch('/api/tracks', { method:'POST', headers: headers(), body: fd });
  const data = await r.json();
  toast(data.message || data.detail);
  if (r.ok) loadTracks();
}

async function loadTracks() {
  const r = await fetch('/api/tracks', { headers: headers() });
  const tracks = await r.json();
  const root = document.getElementById('tracks');
  root.innerHTML = '';
  for (const t of tracks) {
    const div = document.createElement('div');
    div.className = 'track';
    div.innerHTML = `
      <strong>${t.title}</strong><br>
      ${t.artist_name} • by ${t.author_display_name}<br>
      <small>${new Date(t.uploaded_at).toLocaleString()}</small><br>
      <button onclick="playTrack('${t.stream_url}', '${t.title} - ${t.artist_name}')">▶ Слушать</button>
    `;
    root.appendChild(div);
  }
}

function playTrack(url, title) {
  const audio = document.getElementById('audioPlayer');
  audio.src = url;
  audio.play();
  document.getElementById('playingNow').textContent = `Сейчас играет: ${title}`;
}

async function loadAuthors() {
  const r = await fetch('/api/authors', { headers: headers() });
  const authors = await r.json();
  const root = document.getElementById('authorsList');
  root.innerHTML = '';
  for (const a of authors) {
    const div = document.createElement('div');
    div.className = 'author';
    div.innerHTML = `
      <strong>${a.display_name}</strong> (${a.email})
      <button onclick="toggleSubscribe(${a.id})">${a.subscribed ? 'Отписаться' : 'Подписаться'}</button>
    `;
    root.appendChild(div);
  }
}

async function toggleSubscribe(id) {
  const r = await fetch(`/api/authors/${id}/subscribe`, { method:'POST', headers: headers() });
  const data = await r.json();
  toast(data.message || data.detail);
  await Promise.all([loadAuthors(), loadTracks()]);
}
