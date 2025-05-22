// api/auth.js
const CLIENT_ID = process.env.CLIENT_ID;
const REDIRECT_URI = process.env.REDIRECT_URI;

export default function handler(req, res) {
  const state = Math.random().toString(36).substring(2, 15);
  const scope = "channel:read:ads channel:edit:commercial";

  const url = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}` +
              `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
              `&response_type=code&scope=${encodeURIComponent(scope)}` +
              `&state=${state}&force_verify=true`;

  res.writeHead(302, { Location: url });
  res.end();
}
