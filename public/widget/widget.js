const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const infoDiv = document.getElementById("info");
const progressBar = document.getElementById("progress-bar");
const anuncioIndice = document.getElementById("anuncio-indice");
const anuncioTotal = document.getElementById("anuncio-total");
const timerText = document.getElementById("timer-text");

let anuncios = [];
let anuncioActual = 0;
let totalDuracion = 0;

async function obtenerDatos(isTest = false) {
  console.log("ADDDDDS!!!!!");
  if (!token) {
    anuncioIndice.textContent = "-";
    anuncioTotal.textContent = "-";
    infoDiv.style.display = "block";
    return;
  }

  try {
    let data;
    if (isTest) {
      data = {
        data: [
          {
            snooze_count: 0,
            snooze_refresh_at: 0,
            next_ad_at: 1748069880,
            duration: 60,
            last_ad_at: 1748069280,
            preroll_free_time: 0
          }
        ]
      };
    } else {
      const res = await fetch(`/api/ads?access_token=${token}`);
      console.log(res);
      data = await res.json();
    }

    console.log(data.data);
    anuncios = data.data;
    totalDuracion = anuncios.reduce((acc, ad) => acc + ad.duration, 0);
    console.log(totalDuracion);
    console.log(anuncios.length);
    console.log(anuncios[0].next_ad_at);
    if (anuncios.length > 0 && anuncios[0].next_ad_at) {
      const nextAdTime = anuncios[0].next_ad_at * 1000;
      console.log(nextAdTime);
      const lastAdAt = anuncios[0].last_ad_at * 1000;
      console.log(lastAdAt);
      const now = Date.now();
      console.log(now);
      const diff = nextAdTime - now;
      console.log(diff);

      console.log("Next ad at:", new Date(nextAdTime).toLocaleTimeString());
      console.log("Now:", new Date(now).toLocaleTimeString());
      console.log("Diff (ms):", diff);

      if(diff > 10000){
        setTimeout(() => iniciarCuentaRegresiva(10), diff - 10000);
      }else if(diff > 0){
        iniciarCuentaRegresiva(Math.floor(diff/1000));
      }else{
        iniciarProgreso();
        mostrarSiguienteAnuncio();
      }
    } else {
      anuncioIndice.textContent = "-";
      anuncioTotal.textContent = "-";
      infoDiv.style.display = "block";
    }

  } catch (err) {
    console.error(err);
    anuncioIndice.textContent = "-";
    anuncioTotal.textContent = "-";
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

//

function iniciarCuentaRegresiva(segundos){
  let contador = segundos;
  infoDiv.style.display = "block";

  const intervalo = setInterval(() => {
    timerText.textContent = `Anuncios en ${contador}`;
    contador--;

    if(contador < 0){
      clearInterval(intervalo);
      iniciarProgreso();
      mostrarSiguienteAnuncio();
    }
  }, 1000);
}

function mostrarSiguienteAnuncio() {
  //si anuncio es 3 >= 3 termina
    if (anuncioActual >= anuncios.length) {
      console.log("Todos los anuncios mostrados. Esperando para volver a verificar...");
      setTimeout(() => {
        anuncioActual = 0;
        obtenerDatos(isTest);
      }, 60 * 1000); // espera 1 minuto antes de volver a consultar
      return;
  }

  const ad = anuncios[anuncioActual];
  anuncioIndice.textContent = anuncioActual + 1;
  anuncioTotal.textContent = anuncios.length;
  timerText.innerHTML = `Anuncios: <span id="anuncio-indice">${anuncioActual + 1}</span> de <span id="anuncio-total">${anuncios.length}</span>`;
  infoDiv.style.display = "block";

  gsap.fromTo(infoDiv, 
    { opacity: 0 },
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

const isTest = params.get("test") === "true";
obtenerDatos(isTest);
