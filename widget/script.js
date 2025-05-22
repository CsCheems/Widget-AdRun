const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const infoDiv = document.getElementById("info");
const progressBar = document.getElementById("progress-bar");

let countdownInterval = null;

async function obtenerDatos() {
  if (!token) {
    infoDiv.innerHTML = "<div class='error'>Token no proporcionado.</div>";
    return;
  }

  try {
    const res = await fetch(`/api/ads?access_token=${token}`);
    const data = await res.json();

    const ad = data.data?.[0];
    if (ad && ad.next_ad_at) {
      const nextAdTime = new Date(ad.next_ad_at).getTime();
      const now = Date.now();
      const secondsUntilAd = Math.floor((nextAdTime - now) / 1000);

      infoDiv.innerHTML = `
        <div><span class="label">⏰ Próximo anuncio:</span> ${new Date(ad.next_ad_at).toLocaleTimeString()}</div>
        <div><span class="label">🎬 Duración:</span> ${ad.duration} segundos</div>
        <div><span class="label">🛡️ Preroll free:</span> ${ad.preroll_free_time} segundos</div>
        <div><span class="label">😴 Snoozes restantes:</span> ${ad.snooze_count}</div>
      `;

      iniciarCuentaRegresiva(secondsUntilAd);
    } else {
      detenerCuentaRegresiva();
      infoDiv.innerHTML = "<div class='error'>No hay anuncio programado actualmente.</div>";
    }
  } catch (err) {
    console.error(err);
    detenerCuentaRegresiva();
    infoDiv.innerHTML = "<div class='error'>Error al obtener datos de Twitch.</div>";
  }
}

function iniciarCuentaRegresiva(segundos) {
  detenerCuentaRegresiva(); // limpia si había otro

  let tiempoRestante = segundos;
  const total = segundos;

  function actualizarBarra() {
    const porcentaje = Math.max(0, ((total - tiempoRestante) / total) * 100);
    progressBar.style.width = `${porcentaje}%`;
    tiempoRestante--;

    if (tiempoRestante < 0) {
      detenerCuentaRegresiva();
    }
  }

  actualizarBarra();
  countdownInterval = setInterval(actualizarBarra, 1000);
}

function detenerCuentaRegresiva() {
  clearInterval(countdownInterval);
  progressBar.style.width = "0%";
}

obtenerDatos();
setInterval(obtenerDatos, 30000); // actualiza cada 30s
