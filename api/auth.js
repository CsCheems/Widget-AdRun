export default function handler(req, res) {
  const scope = "channel:read:ads channel:edit:commercial";
  const state = Math.random().toString(36).substring(2);

  const url =
    `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
    `&response_type=code&scope=${encodeURIComponent(scope)}` +
    `&state=${state}&force_verify=true`;

  res.writeHead(302, { Location: url });
  res.end();
}
