// server.js
const express = require("express");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 3000;

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;

// Sirve la página pública con el botón de autorizar
app.use(express.static(path.join(__dirname, "public")));

// Ruta que redirige a Twitch para autorizar la app
app.get("/auth", (req, res) => {
  const state = Math.random().toString(36).substring(2, 15); // valor aleatorio para seguridad
  const scope = "channel:read:ads channel:edit:commercial";
;

  const url = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}` +
              `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
              `&response_type=code&scope=${encodeURIComponent(scope)}` +
              `&state=${state}&force_verify=true`;

  res.redirect(url);
});

// Callback de Twitch con el código
app.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send("No code recibido");
  }

  try {
    // Intercambia el code por access_token
    const tokenResponse = await axios.post("https://id.twitch.tv/oauth2/token", null, {
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      },
    });

    const accessToken = tokenResponse.data.access_token;

    // Redirige al widget con token en query
    res.redirect(`/widget?token=${accessToken}`);
  } catch (error) {
    console.error("Error obteniendo token:", error.response?.data || error.message);
    res.status(500).send("Error obteniendo token");
  }
});

// Sirve el widget que usará el token para mostrar info (más adelante se mejora)
app.get("/widget", (req, res) => {
  res.sendFile(path.join(__dirname, "widget", "widget.html"));
});

app.get("/api/ads", async (req, res) => {
  const access_token = req.query.access_token;

  try {
    const userRes = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client-Id": CLIENT_ID
      }
    });

    const broadcaster_id = userRes.data.data[0].id;

    const adsRes = await axios.get(`https://api.twitch.tv/helix/channels/ads?broadcaster_id=${broadcaster_id}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client-Id": CLIENT_ID
      }
    });

    res.json(adsRes.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Error al obtener anuncios");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
