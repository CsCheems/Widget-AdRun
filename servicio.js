
const express = require("express");
const axios = require("axios");
const path = require("path");
require("dotenv").config();
const admin = require("firebase-admin");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, FIREBASE_CREDENTIALS } = process.env;

admin.initializeApp({
  credential: admin.credential.cert(require(FIREBASE_CREDENTIALS))
});
const db = admin.firestore();

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

app.get("/api/auth", (req, res) => {
  const scope = "channel:read:ads channel:edit:commercial";
  const state = Math.random().toString(36).substring(2);

  const url =
    `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
    `&response_type=code&scope=${encodeURIComponent(scope)}` +
    `&state=${state}&force_verify=true`;

  res.writeHead(302, { Location: url });
  res.end();
});

app.get("/api/callback", async (req, res) => {
   try {
    const { code, state } = req.query;

    if (!code) {
      console.error("No se recibió el código OAuth");
      return res.status(400).send("No code recibido");
    }

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      console.error("Faltan variables de entorno:", { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI });
      return res.status(500).send("Configuración incorrecta del servidor");
    }

    console.log("Recibido código OAuth:", code);
    
    const tokenResponse = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      null,
      {
        params: {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: REDIRECT_URI,
        },
      }
    );

    console.log("Respuesta token:", tokenResponse.data);

    const {accessToken, refresh_token} = tokenResponse.data;

    const userRes = await axios.get("https://api.twitch.tv/helix/users",{
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client_id": CLIENT_ID,
      },
    });

    const user = userRes.data.data[0];

    await db.collection("tokens").doc(user.login).set({
      access_token,
      refresh_token,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.writeHead(302, { Location: `/widget/widget.html?token=${accessToken}` });
    res.end();

  } catch (error) {
    console.error("Error en handler /api/callback:", error.response?.data || error.message || error);
    res.status(500).send("Error obteniendo token");
  }
});

app.post("/api/refresh", async (req, res) => {
  const {user} = req.body;

  if(!user){
    return res.status(400).send("Usuario requerido");
  }

  try{
    const doc = await db.collection("tokens").doc(user).get();
    if(!doc.exists){
      return res.status(400).send("No se encontro usuario");
    }

    const { refresh_token } = doc.data;

    const response = await axios.post("https://id.twitch.tv/oauth2/token", null, {
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token
      }
    });

    const { access_token, refresh_token: new_refresh_token} = response.data;

    await db.collection("tokens").doc(user).update({
      access_token,
      refresh_token: new_refresh_token,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({access_token});
  }catch(error){
    console.error("Error refrescando token:", err.response?.data || err.message);
    res.status(500).send("No se pudo refrescar el token");
  }
});

app.get("/api/widget", (req, res) => {
  res.sendFile(path.join(__dirname, "public/widget", "widget.html"));
});

app.get("/ads", async (req, res) => {
  const access_token = req.query.access_token;

  if (!access_token) {
    return res.status(400).send("Falta access_token");
  }

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
