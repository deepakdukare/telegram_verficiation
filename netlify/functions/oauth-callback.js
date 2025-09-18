// netlify/functions/oauth-callback.js
import fetch from 'node-fetch';

export async function handler(event, context) {
  const { code } = event.queryStringParameters;

  if (!code) {
    return {
      statusCode: 400,
      body: 'Missing code in query parameters.',
    };
  }

  // Google OAuth token endpoint
  const tokenUrl = 'https://oauth2.googleapis.com/token';

  const clientId = '137807353004-1fb5tmhiguimvek1cc28msnsmgpfbb0e.apps.googleusercontent.com';
  const clientSecret = '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';
  const redirectUri = 'https://roaring-moxie-9f97cc.netlify.app/.netlify/functions/oauth-callback';

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

    // Here you can save tokens in your database if needed

    // Show success page to the user
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <html>
          <head><title>Login Successful</title></head>
          <body style="font-family: Arial; text-align:center; padding-top:50px;">
            <h1>✅ Login Successful!</h1>
            <p>You can now close this window.</p>
            <pre>${JSON.stringify(tokens, null, 2)}</pre>
          </body>
        </html>
      `,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: 'Error exchanging code for tokens: ' + error.message,
    };
  }
}