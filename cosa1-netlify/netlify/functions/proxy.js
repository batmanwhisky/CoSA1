const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Whitelist allowed domains for proxying (add your allowed domains here)
const ALLOWED_HOSTNAMES = [
  'api.github.com',
  'sheets.googleapis.com',
  // Add more domains as needed
];

const TIMEOUT_MS = 15000; // Request timeout in milliseconds

// Helper to check if a URL is allowed
function isAllowed(urlStr) {
  try {
    const url = new URL(urlStr);
    return ALLOWED_HOSTNAMES.includes(url.hostname);
  } catch (e) {
    return false;
  }
}

// Helper for timeout
function fetchWithTimeout(url, options, timeout = TIMEOUT_MS) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Proxy timeout')), timeout)),
  ]);
}

exports.handler = async function(event) {
  // Allow preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: '',
    };
  }

  let body, url, method, headers;
  try {
    // For security, require POST and JSON body with { url, method, headers, body }
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    body = JSON.parse(event.body || '{}');
    url = body.url;
    method = (body.method || 'GET').toUpperCase();
    headers = body.headers || {};
    const requestBody = body.body;

    if (!url || !isAllowed(url)) {
      return { statusCode: 400, body: 'Invalid or unauthorized target URL.' };
    }

    // Remove any headers that could be dangerous
    delete headers['host'];
    delete headers['x-forwarded-for'];
    delete headers['x-real-ip'];

    // Make proxied request
    const resp = await fetchWithTimeout(url, {
      method,
      headers,
      body: ['POST','PUT','PATCH'].includes(method) ? requestBody : undefined,
    });

    let respBody;
    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      respBody = await resp.text(); // Don't double-encode JSON
    } else {
      respBody = await resp.text();
    }

    // Pass through CORS
    return {
      statusCode: resp.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'content-type': contentType,
      },
      body: respBody,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ error: error.message, stack: error.stack }),
    };
  }
};