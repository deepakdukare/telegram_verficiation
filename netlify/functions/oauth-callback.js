// netlify/functions/oauth-callback.js
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

export async function handler(event) {
  const { code } = event.queryStringParameters;

  if (!code) {
    return {
      statusCode: 400,
      body: 'Missing code in query parameters.',
    };
  }

  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const redirectUri = process.env.REDIRECT_URI || 'https://roaring-moxie-9f97cc.netlify.app/.netlify/functions/oauth-callback';

  try {
    // Exchange authorization code for tokens
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await response.json();

    if (tokens.error) {
      return {
        statusCode: 400,
        body: `Error getting tokens: ${tokens.error_description || tokens.error}`,
      };
    }

    // ✅ Load index.html from public folder (if you want to keep it as a file)
    const filePath = path.join(process.cwd(), 'public', 'index.html');
    let html = `<h2>✅ Authentication Successful!</h2><p>You can close this page now.</p>`; // fallback

    if (fs.existsSync(filePath)) {
      html = fs.readFileSync(filePath, 'utf-8');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: html,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: 'Error exchanging code for tokens: ' + error.message,
    };
  }
}
