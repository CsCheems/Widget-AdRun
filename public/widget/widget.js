const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const infoDiv = document.getElementById("info");
const progressBar = document.getElementById("progress-bar");

let countdownInterval = null;

async function obtenerDatos(isTest = true) {
  if (!token) {
    infoDiv.innerHTML = "<div class='error'>Token no proporcionado.</div>";
    return;
  }

  try {
    let data;

    if (isTest) {
      // Datos simulados para test
      data = {
        data: [{
          next_ad_at: new Date(Date.now() + 15000).toISOString(), // anuncio en 15 seg
          duration: 30,
          preroll_free_time: 5,
          snooze_count: 2,
        }],
      };
    } else {
      const res = await fetch(`/api/ads?access_token=${token}`);
      data = await res.json();
    }

    const ad = data.data?.[0];
    if (ad && ad.next_ad_at) {
      const nextAdTime = new Date(ad.next_ad_at).getTime();
      const now = Date.now();
      const secondsUntilAd = Math.floor((nextAdTime - now) / 1000);

      infoDiv.innerHTML = `
        <div><span class="label">⏰ Próximo anuncio:</span> ${new Date(ad.next_ad_at).toLocaleTimeString()}</div>
        <div><span class="label">🎬 Duración:</span> ${ad.duration} segundos</div>
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
  detenerCuentaRegresiva();

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

// Usa el parámetro "test" de la URL para definir si es modo test o no
const isTest = params.get("test") === "true";

obtenerDatos(isTest);
setInterval(() => obtenerDatos(isTest), 30000);
