const params = new URLSearchParams(window.location.search);
const user = params.get("user");
const infoDiv = document.getElementById("info");
const progressBar = document.getElementById("progress-bar");
const anuncioIndice = document.getElementById("anuncio-indice");
const anuncioTotal = document.getElementById("anuncio-total");
const timerText = document.getElementById("timer-text");

let anuncios = [];
let anuncioActual = 0;
let totalDuracion = 0;

async function obtenerDatos(isTest = false) {

  console.log(user);

  if (!user) {
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
            next_ad_at: 1748136775,
            duration: 120,
            last_ad_at: 1748133224,
            preroll_free_time: 0
          }
        ]
      };
    } else {
      const res = await fetch(`/api/ads?user=${user}`);
      console.log(res);
      data = await res.json();
    }
    anuncios = data.data;
    totalDuracion = anuncios.reduce((acc, ad) => acc + ad.duration, 0);

    if (anuncios.length > 0 && anuncios[0].next_ad_at) {
      const nextAdTime = anuncios[0].next_ad_at * 1000;
      console.log(nextAdTime);
      const lastAdAt = anuncios[0].last_ad_at * 1000;
      console.log(lastAdAt);
      const now = Date.now();
      const diff = nextAdTime - now;
      console.log("Next ad at:", new Date(nextAdTime).toLocaleTimeString());
      console.log("Now:", new Date(now).toLocaleTimeString());
      console.log("Diff (ms):", diff);

      if(diff > 10000){
        setTimeout(() => iniciarCuentaRegresiva(10), diff - 10000);
      }else if(diff > 0){
        iniciarCuentaRegresiva(Math.floor(diff/1000));
      }else{
        iniciarProgreso();
        mostrarSiguienteAnuncio(totalDuracion);
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
  
  progressBar.style.display = "block";
  gsap.set(progressBar, {scaleX: 1});
  gsap.to(progressBar, {
    duration: totalDuracion,
    scaleX: 0,
    ease: "linear"
  });
}

function iniciarCuentaRegresiva(segundos){
  let contador = segundos;
  infoDiv.style.display = "block";
   gsap.fromTo(infoDiv,
    { opacity: 0 },
    { opacity: 1, duration: 0.5 }
  );

  const intervalo = setInterval(() => {
    timerText.textContent = `Anuncios en ${contador}`;
    contador--;

    if(contador < 0){
      clearInterval(intervalo);
      iniciarProgreso();
      anuncioDuracion(totalDuracion);
    }
  }, 1000);
}

function anuncioDuracion(totalDuracion) {
  let duracion = totalDuracion;
  infoDiv.style.display = "block";

  const intervalo = setInterval(() => {
    let minutos = Math.floor((duracion%3600)/60);
    let segundos = duracion % 60;

    minutos = minutos < 10 ? "0" + minutos : minutos;
    segundos = segundos < 10 ? "0" + segundos : segundos;

    timerText.textContent = `Anuncios • ${minutos}:${segundos}`;
    duracion--;

    if(duracion < 0){
      clearInterval(intervalo);
      infoDiv.style.display = "none";
      setTimeout(() =>{
        console.log("Reseteando...");
        obtenerDatos(isTest);
      }, 60*1000);
    }
  }, 1000);

  gsap.fromTo(infoDiv,
    { opacity: 0 },
    { opacity: 1, duration: 0.5 }
  );
}

const isTest = params.get("test") === "true";
obtenerDatos(isTest);
