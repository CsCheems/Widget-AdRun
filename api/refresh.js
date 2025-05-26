import axios from "axios";
import admin from "firebase-admin";


const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Método no permitido");
  }

  const { user } = req.body;

  if (!user) return res.status(400).send("Id usuario requerido");

  try {
    const doc = await db.collection("adWidget").doc(user).get();
    if (!doc.exists) {
      return res.status(404).send("Usuario no encontrado");
    }

    const { refresh_token } = doc.data();

    const response = await axios.post("https://id.twitch.tv/oauth2/token", null, {
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token,
      },
    });

    const { access_token, refresh_token: new_refresh_token } = response.data;

    await db.collection("adWidget").doc(user).update({
      access_token,
      refresh_token: new_refresh_token,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ access_token });
  } catch (error) {
    console.error("Error refrescando token:", error.response?.data || error.message);
    res.status(500).send("No se pudo refrescar el token");
  }
}
