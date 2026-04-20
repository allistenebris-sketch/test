requireAuth();

async function uploadTrack() {
  const file = document.getElementById('trackFile').files[0];
  if (!file) {
    toast('Выберите аудиофайл');
    return;
  }

  const fd = new FormData();
  fd.append('title', document.getElementById('trackTitle').value);
  fd.append('artist_name', document.getElementById('trackArtist').value);
  fd.append('file', file);

  try {
    const data = await api('/api/tracks', {
      method: 'POST',
      body: fd,
    });
    toast(data.message);
  } catch (e) {
    toast(e.message);
  }
}
