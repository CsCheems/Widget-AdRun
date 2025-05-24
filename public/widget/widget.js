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
          { duration: 30, 
            next_ad_at: Date.now() + 30000 }
        ]
      };
    } else {
      const res = await fetch(`/api/ads?access_token=${token}`);
      data = await res.json();
    }

    console.log(data.data);
    anuncios = data.data;
    totalDuracion = anuncios.reduce((acc, ad) => acc + ad.duration, 0);
    console.log(totalDuracion);
    console.log(anuncios.length);
    console.log(anuncios[0].next_ad_at);
    if (anuncios.length > 0 && anuncios[0].next_ad_at) {
      const nextAdTime = anuncios[0].next_ad_at;
      console.log(nextAdTime);
      const lastAdAt = anuncios[0].last_ad_at;
      console.log(lastAdAt);
      //const diff = nextAdTime - lastAdAt;
      const now = new Date(Date.now()).getTime();
      console.log(now);
      const diff = now - nextAdTime;
      console.log(diff);
      console.log(Math.floor(diff/1000));

      // const diffx1000 = diff * 1000;
      // console.log(diffx1000);
      // console.log(diff);

      // const nextAdTime = new Date(anuncios[0].next_ad_at).getTime();
      // console.log(nextAdTime);
      // const now = new Date(Date.now()).getTime();
      // console.log(now);
      // const diff = now - nextAdTime;
      // console.log(diff);

      if(diff > 10000){
        setTimeout(() => iniciarCuentaRegresiva(10), diff/1000);
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
