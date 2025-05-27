const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { GoogleAuth } = require('google-auth-library');

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  // Load credentials from Netlify environment variable
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");

  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  try {
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const apiUrl = "https://discoveryengine.googleapis.com/v1alpha/projects/310961014296/locations/global/collections/default_collection/engines/cosa1_1748271255057/servingConfigs/default_search:search";

    const apiResp = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.token || token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await apiResp.text();
    return {
      statusCode: apiResp.status,
      body: data,
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Proxy request failed", details: e.message }),
    };
  }
};