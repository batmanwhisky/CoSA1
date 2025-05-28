const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const ALLOWED_HOSTNAMES = [
  'api.github.com',
  'cosa1.netlify.app',
  'sheets.googleapis.com',
  'sanantonio.gov',
  // Add more domains as needed
];

// For wildcard support like *.sanantonio.gov
const ALLOWED_HOSTNAME_PATTERNS = [
  /\.sanantonio\.gov$/,
];

const TIMEOUT_MS = 15000;

function isAllowed(urlStr) {
  try {
    const url = new URL(urlStr);
    // Direct match
    if (ALLOWED_HOSTNAMES.includes(url.hostname)) return true;
    // Wildcard match
    return ALLOWED_HOSTNAME_PATTERNS.some((regex) => regex.test(url.hostname));
  } catch (e) {
    return false;
  }
}

function fetchWithTimeout(url, options, timeout = TIMEOUT_MS) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Proxy timeout')), timeout)),
  ]);
}

function cleanHeaders(headers = {}) {
  // Remove dangerous headers (case-insensitive)
  const forbidden = ['host', 'x-forwarded-for', 'x-real-ip'];
  const cleaned = {};
  Object.keys(headers).forEach((key) => {
    if (!forbidden.includes(key.toLowerCase())) {
      cleaned[key] = headers[key];
    }
  });
  return cleaned;
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

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: 'Method Not Allowed'
      };
    }

    const body = JSON.parse(event.body || '{}');
    const url = body.url;
    const method = (body.method || 'GET').toUpperCase();
    const headers = cleanHeaders(body.headers || {});
    const requestBody = body.body;

    if (!url || !isAllowed(url)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: 'Invalid or unauthorized target URL.'
      };
    }

    const resp = await fetchWithTimeout(url, {
      method,
      headers,
      body: ['POST','PUT','PATCH'].includes(method) ? requestBody : undefined,
    });

    const contentType = resp.headers.get('content-type') || '';
    let respBody = await resp.text();

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