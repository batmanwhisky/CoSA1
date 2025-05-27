const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { GoogleAuth } = require('google-auth-library');

exports.handler = async (event, context) => {
  try {
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
      console.error("Invalid JSON:", e);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON" }),
      };
    }

    const creds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!creds) {
      console.error("Missing GOOGLE_SERVICE_ACCOUNT_JSON environment variable.");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing Google credentials" }),
      };
    }

    let credentials;
    try {
      credentials = JSON.parse(creds);
    } catch (e) {
      console.error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON:", e);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid Google credentials JSON" }),
      };
    }

    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    let token;
    try {
      const client = await auth.getClient();
      token = await client.getAccessToken();
    } catch (e) {
      console.error("Failed to get Google API token:", e);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to authenticate with Google API" }),
      };
    }

    const apiUrl = "https://discoveryengine.googleapis.com/v1alpha/projects/310961014296/locations/global/collections/default_collection/engines/cosa1_1748271255057/servingConfigs/default_search:search";
    let apiResp;
    try {
      apiResp = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.token || token}`,
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.error("Network error calling Google API:", e);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Failed to contact Google API" }),
      };
    }

    const data = await apiResp.text();
    if (!apiResp.ok) {
      console.error("Google API error:", apiResp.status, data);
    }
    return {
      statusCode: apiResp.status,
      body: data,
    };
  } catch (e) {
    console.error("Proxy function uncaught error:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Proxy function crashed", details: e.message }),
    };
  }
};