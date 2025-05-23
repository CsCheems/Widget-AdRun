import axios from "axios";
import { readFile } from "fs/promises";

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const FIREBASE_CREDENTIALS = process.env.FIREBASE_CREDENTIALS;

import admin from "firebase-admin";

const serviceAccount = JSON.parse(
  await readFile(new URL(FIREBASE_CREDENTIALS, import.meta.url), "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
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

    const {access_token, refresh_token} = tokenResponse.data;

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

    res.writeHead(302, { Location: `/widget/widget.html?token=${access_token}` });
    res.end();

  } catch (error) {
    console.error("Error en handler /api/callback:", error.response?.data || error.message || error);
    res.status(500).send("Error obteniendo token");
  }
}
