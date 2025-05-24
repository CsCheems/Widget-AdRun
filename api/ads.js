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

async function getAccessToken(user) {
  const res = await axios.post(`${process.env.REDIRECT_URI}/api/refresh`, { user });
  console.log(res);
  return res.data.access_token;
  
}

export default async function handler(req, res) {
  let access_token = req.query.access_token;
  const user = req.query.user;

  if (!access_token || !user) {
    return res.status(400).send("Falta access_token o user");
  }

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

    res.status(200).json(adsRes.data);
  } catch (err) {
    if (err.response?.status === 401) {
      try {
        // Token expirado, intenta refrescarlo
        console.log("Token expirado. Intentando refrescar...");

        const newAccessToken = await getAccessToken(user);

        // Reintenta con el nuevo token
        const userRes = await axios.get("https://api.twitch.tv/helix/users", {
          headers: {
            Authorization: `Bearer ${newAccessToken}`,
            "Client-Id": CLIENT_ID,
          },
        });

        const broadcaster_id = userRes.data.data[0].id;

        const adsRes = await axios.get(`https://api.twitch.tv/helix/channels/ads?broadcaster_id=${broadcaster_id}`, {
          headers: {
            Authorization: `Bearer ${newAccessToken}`,
            "Client-Id": CLIENT_ID,
          },
        });

        return res.status(200).json(adsRes.data);
      } catch (refreshError) {
        console.error("Error al refrescar token:", refreshError.response?.data || refreshError.message);
        return res.status(401).send("Token expirado y no se pudo refrescar");
      }
    }

    console.error(err.response?.data || err.message);
    return res.status(500).send("Error al obtener anuncios");
  }
}
