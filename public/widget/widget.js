const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const infoDiv = document.getElementById("info");
const progressBar = document.getElementById("progress-bar");

let anuncios = [];
let anuncioActual = 0;
let totalDuracion = 0;

async function obtenerDatos(isTest = false) {
  if (!token) {
    infoDiv.innerHTML = "Token no proporcionado.";
    infoDiv.style.display = "block";
    return;
  }

  try {
    let data;
    if (isTest) {
      data = {
        data: [
          { duration: 30 },
          { duration: 30 },
          { duration: 30 },
        ]
      };
    } else {
      const res = await fetch(`/api/ads?access_token=${token}`);
      data = await res.json();
    }

    anuncios = data.data;
    totalDuracion = anuncios.reduce((acc, ad) => acc + ad.duration, 0);
    if (anuncios.length > 0) {
      iniciarProgreso();
      mostrarSiguienteAnuncio();
    } else {
      infoDiv.innerHTML = "No hay anuncios.";
      infoDiv.style.display = "block";
    }

  } catch (err) {
    console.error(err);
    infoDiv.innerHTML = "Error al obtener datos de Twitch.";
    infoDiv.style.display = "block";
  }
}

function iniciarProgreso() {
  gsap.killTweensOf(progressBar);
  progressBar.style.transform = "scaleX(1)";
  progressBar.style.display = "block";

  gsap.to(progressBar, {
    duration: totalDuracion,
    scaleX: 0,
    ease: "linear"
  });
}

function mostrarSiguienteAnuncio() {
  if (anuncioActual >= anuncios.length) return;

  const ad = anuncios[anuncioActual];
  const texto = `Anuncios: ${anuncioActual + 1} de ${anuncios.length}`;
  infoDiv.innerHTML = texto;

  gsap.fromTo(infoDiv, 
    { opacity: 0, display: "block" },
    { opacity: 1, duration: 0.5 }
  );

  setTimeout(() => {
    gsap.to(infoDiv, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        infoDiv.style.display = "none";
        anuncioActual++;
        mostrarSiguienteAnuncio();
      }
    });
  }, ad.duration * 1000);
}

// Usa el parámetro "test" de la URL para definir si es modo test o no
const isTest = params.get("test") === "true";

obtenerDatos(isTest);
