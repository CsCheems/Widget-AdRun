import axios from "axios";

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

export default async function handler(req, res) {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send("No code recibido");
  }

  try {
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

    // ✅ Redirección correcta para Vercel
    res.redirect(302, `/widget/widget.html?token=${accessToken}`);
  } catch (error) {
    console.error("Error obteniendo token:", error.response?.data || error.message);
    res.status(500).send("Error obteniendo token");
  }
}
