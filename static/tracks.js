requireAuth();

function playTrack(trackId, title) {
  const token = encodeURIComponent(getToken());
  const audio = document.getElementById('audioPlayer');
  audio.src = `/api/tracks/${trackId}/stream?token=${token}`;
  audio.play();
  document.getElementById('playingNow').textContent = `Сейчас играет: ${title}`;
}

async function loadTracks() {
  try {
    const tracks = await api('/api/tracks');
    const root = document.getElementById('tracks');
    root.innerHTML = '';

    for (const t of tracks) {
      const div = document.createElement('div');
      div.className = 'track';
      div.innerHTML = `
        <strong>${t.title}</strong><br>
        ${t.artist_name} • by ${t.author_display_name}<br>
        <small>${new Date(t.uploaded_at).toLocaleString()}</small><br>
        <button data-id="${t.id}">▶ Слушать</button>
      `;
      div.querySelector('button').onclick = () => playTrack(t.id, `${t.title} - ${t.artist_name}`);
      root.appendChild(div);
    }
  } catch (e) {
    toast(e.message);
  }
}

loadTracks();
