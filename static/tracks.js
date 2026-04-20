requireAuth();

let tracksState = [];
let currentIndex = -1;

const audio = document.getElementById('audioPlayer');
const queueRoot = document.getElementById('queueList');
const feedRoot = document.getElementById('tracks');
const playingNow = document.getElementById('playingNow');
const playingHint = document.getElementById('playingHint');

function trackLabel(track) {
  return `${track.title} — ${track.artist_name}`;
}

function playByIndex(index, autoPlay = true) {
  if (!tracksState.length || index < 0 || index >= tracksState.length) return;

  currentIndex = index;
  const track = tracksState[currentIndex];
  const token = encodeURIComponent(getToken());
  audio.src = `/api/tracks/${track.id}/stream?token=${token}`;

  playingNow.textContent = `Сейчас играет: ${trackLabel(track)}`;
  playingHint.textContent = `Автор: ${track.author_display_name}`;

  if (autoPlay) {
    audio.play().catch(() => {});
  }

  renderQueue();
  renderFeed();
}

function playNext() {
  if (!tracksState.length) return;
  const nextIndex = (currentIndex + 1) % tracksState.length;
  playByIndex(nextIndex);
}

function playPrev() {
  if (!tracksState.length) return;
  const prevIndex = (currentIndex - 1 + tracksState.length) % tracksState.length;
  playByIndex(prevIndex);
}

function togglePause() {
  if (!audio.src) {
    if (tracksState.length) playByIndex(0);
    return;
  }
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
}

function renderQueue() {
  queueRoot.innerHTML = '';
  if (!tracksState.length) {
    queueRoot.innerHTML = '<small>Очередь пуста</small>';
    return;
  }

  tracksState.forEach((track, index) => {
    const item = document.createElement('button');
    item.className = `queue-item ${index === currentIndex ? 'active' : ''}`;
    item.innerHTML = `<strong>${track.title}</strong><small>${track.artist_name}</small>`;
    item.onclick = () => playByIndex(index);
    queueRoot.appendChild(item);
  });
}

function renderFeed() {
  feedRoot.innerHTML = '';

  tracksState.forEach((track, index) => {
    const div = document.createElement('div');
    div.className = `track ${index === currentIndex ? 'playing' : ''}`;
    div.innerHTML = `
      <strong>${track.title}</strong><br>
      ${track.artist_name} • by ${track.author_display_name}<br>
      <small>${new Date(track.uploaded_at).toLocaleString()}</small><br>
      <button>▶ Слушать</button>
    `;
    div.querySelector('button').onclick = () => playByIndex(index);
    feedRoot.appendChild(div);
  });
}

async function loadTracks() {
  try {
    tracksState = await api('/api/tracks');
    if (!tracksState.length) {
      playingNow.textContent = 'Нет треков';
      playingHint.textContent = 'Загрузите первый трек на странице «Загрузка»';
    }
    renderQueue();
    renderFeed();
  } catch (e) {
    toast(e.message);
  }
}

document.getElementById('prevBtn').onclick = playPrev;
document.getElementById('nextBtn').onclick = playNext;
document.getElementById('playPauseBtn').onclick = togglePause;
audio.addEventListener('ended', playNext);

loadTracks();
