const { google } = require("googleapis");

const requiredEnvVariables = [
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "GOOGLE_DRIVE_FOLDER_ID",
];

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    throw new Error(`${variable} is missing`);
  }
}

// Format the private key to handle both literal newlines, raw \\n strings, and surrounding quotes
let privateKey = process.env.GOOGLE_PRIVATE_KEY.trim();
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1);
}
if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
  privateKey = privateKey.slice(1, -1);
}
privateKey = privateKey.replace(/\\n/g, '\n');

const jwtClient = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

// Debug authorization to output the exact error to Render console logs
jwtClient.authorize((err, tokens) => {
  if (err) {
    console.error("GOOGLE AUTH ERROR DETAILS:", err.message || err);
  } else {
    console.log("GOOGLE AUTH SUCCESSFUL! Token acquired.");
  }
});

const drive = google.drive({
  version: "v3",
  auth: jwtClient,
});

module.exports = drive;