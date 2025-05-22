const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const infoDiv = document.getElementById("info");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");

let countdownInterval = null;

async function obtenerDatos(isTest = false) {
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
        <div><span class="label">⏰ Próximo anuncio:</span> ${new Date(ad.next_ad_at).toLocaleTimeString(navigator.language)}</div>
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
  detenerCuentaRegresiva();

  // Oculta el texto y muestra la barra
  progressText.style.display = "none";
  progressBar.style.display = "block";
  progressBar.style.width = "100%";
  progressBar.style.transformOrigin = "left center";

  // Usa GSAP para animar la barra desde 100% a 0 en "segundos"
  gsap.fromTo(progressBar, 
    { scaleX: 1 }, 
    { duration: segundos, scaleX: 0, ease: "linear" }
  );
}

function detenerCuentaRegresiva() {
  clearInterval(countdownInterval);

  // Para la animación GSAP
  gsap.killTweensOf(progressBar);
  
  // Oculta la barra y muestra el texto
  progressBar.style.display = "none";
  progressBar.style.transform = "scaleX(1)";
  progressText.style.display = "block";
}

// Usa el parámetro "test" de la URL para definir si es modo test o no
const isTest = params.get("test") === "true";

obtenerDatos(isTest);
setInterval(() => obtenerDatos(isTest), 30000);
