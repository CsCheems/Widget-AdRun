import axios from "axios";

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;



export default async function handler(req, res) {

  console.log("Query params:", req.query);
  console.log("CLIENT_ID:", CLIENT_ID);
  console.log("CLIENT_SECRET:", CLIENT_SECRET ? "✅" : "❌");
  console.log("REDIRECT_URI:", REDIRECT_URI);
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

    const accessToken = tokenResponse.data.access_token;

    // Redirigir al widget con token
    res.writeHead(302, { Location: `/widget/widget.html?token=${accessToken}` });
    res.end();

  } catch (error) {
    console.error("Error en handler /api/callback:", error.response?.data || error.message || error);
    res.status(500).send("Error obteniendo token");
  }
}
