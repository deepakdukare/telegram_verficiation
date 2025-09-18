// netlify/functions/callback.js
import { google } from "googleapis";

export async function handler(event) {
  try {
    const { queryStringParameters } = event;
    const code = queryStringParameters.code;

    if (!code) {
      return { statusCode: 400, body: "Missing code parameter" };
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.URL || "http://localhost:8888"}/.netlify/functions/callback`;

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code);

    // Authorize Sheets with service account
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const jwt = new google.auth.JWT(
      serviceAccount.client_email,
      null,
      serviceAccount.private_key,
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    await jwt.authorize();
    const sheets = google.sheets({ version: "v4", auth: jwt });

    // Append to Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: "Sheet1!A:E",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          new Date().toISOString(),
          tokens.access_token,
          tokens.refresh_token || "N/A",
          tokens.expiry_date || "N/A"
        ]],
      },
    });

    return { statusCode: 200, body: "✅ Tokens saved to Google Sheet" };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: `Error: ${err.message}` };
  }
}
