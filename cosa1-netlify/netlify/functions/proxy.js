const { GoogleAuth } = require('google-auth-library');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

exports.handler = async function(event, context) {
  try {
    // Parse Google service account credentials from environment variable
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing GOOGLE_SERVICE_ACCOUNT_JSON environment variable." }),
      };
    }
    const credentials = JSON.parse(serviceAccountJson);

    // Define scopes for Google Sheets API (update if you need different scopes)
    const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

    // Authenticate using google-auth-library
    const auth = new GoogleAuth({
      credentials,
      scopes,
    });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    // Parse the request body for parameters (spreadsheetId, range, etc.)
    let params = {};
    if (event.body) {
      try {
        params = JSON.parse(event.body);
      } catch (e) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid JSON in request body." }),
        };
      }
    }

    // Required parameters: spreadsheetId and range
    const { spreadsheetId, range } = params;
    if (!spreadsheetId || !range) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Please provide both 'spreadsheetId' and 'range' in the request body.",
        }),
      };
    }

    // Make the request to the Google Sheets API
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
    const apiResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken.token || accessToken}`,
      },
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return {
        statusCode: apiResponse.status,
        body: JSON.stringify({ error: errorText }),
      };
    }

    const data = await apiResponse.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message, stack: error.stack }),
    };
  }
};