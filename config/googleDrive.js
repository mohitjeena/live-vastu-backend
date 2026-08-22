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

const jwtClient = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  null,
  privateKey,
  ["https://www.googleapis.com/auth/drive"]
);

const drive = google.drive({
  version: "v3",
  auth: jwtClient,
});

module.exports = drive;