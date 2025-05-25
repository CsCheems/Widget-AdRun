import axios from "axios";
import admin from "firebase-admin";

const CLIENT_ID = process.env.CLIENT_ID;

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export default async function handler(req, res) {

  const { user } = req.query;

  console.log(user);

  if (!user) return res.status(400).send("Falta usuario");

  try {
    const docRef = await db.collection("tokens").doc(user).get();

    if (!docRef.exists) {
      return res.status(404).send("Usuario no encontrado");
    }

    let { access_token, refresh_token } = docRef.data();

    console.log(access_token, refresh_token);

    try {
      const userRes = await axios.get("https://api.twitch.tv/helix/users", {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Client-Id": CLIENT_ID,
        },
      });

      const broadcaster_id = userRes.data.data[0].id;

      const adsRes = await axios.get(`https://api.twitch.tv/helix/channels/ads?broadcaster_id=${broadcaster_id}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Client-Id": CLIENT_ID,
        },
      });

      return res.status(200).json(adsRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        console.log("Token expirado. Intentando refrescar...");

        const refreshRes = await axios.post(`${process.env.REDIRECT_URI}/api/refresh`, { user });

        access_token = refreshRes.data.access_token;

        console.log(access_token);

        const userRes = await axios.get("https://api.twitch.tv/helix/users", {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Client-Id": CLIENT_ID,
          },
        });

        const broadcaster_id = userRes.data.data[0].id;

        const adsRes = await axios.get(`https://api.twitch.tv/helix/channels/ads?broadcaster_id=${broadcaster_id}`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Client-Id": CLIENT_ID,
          },
        });

        return res.status(200).json(adsRes.data);
      }

      throw err;
    }
  } catch (error) {
    console.error("Error en /api/ads:", error.response?.data || error.message);
    return res.status(500).send("Error al obtener anuncios");
  }
}

