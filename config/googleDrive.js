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

// Format the private key to handle both literal newlines and raw \\n strings
const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

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