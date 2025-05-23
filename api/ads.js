import axios from "axios";
const CLIENT_ID = process.env.CLIENT_ID;

export default async function handler(req, res) {
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
    
    res.status(200).json(adsRes.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Error al obtener anuncios");
  }
}
