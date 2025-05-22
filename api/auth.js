export default function handler(req, res) {
  const CLIENT_ID = process.env.CLIENT_ID;
  const REDIRECT_URI = "https://widget-ad-run.vercel.app/api/callback";
  const scope = "channel:read:ads channel:edit:commercial";
  const state = Math.random().toString(36).substring(2, 15);

  const url = `https://id.twitch.tv/oauth2/authorize` +
              `?client_id=${CLIENT_ID}` +
              `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
              `&response_type=code` +
              `&scope=${encodeURIComponent(scope)}` +
              `&state=${state}` +
              `&force_verify=true`;

  res.redirect(url);
}
