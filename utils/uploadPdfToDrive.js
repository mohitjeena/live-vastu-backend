const axios = require("axios");
const drive = require("../config/googleDrive");

async function uploadPdfToDrive(pdfUrl, sessionId) {
  if (!pdfUrl) {
    throw new Error("PDF URL is required");
  }

  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is missing");
  }

  try {
    // Doppio temporary URL se PDF stream download
    const pdfResponse = await axios.get(pdfUrl, {
      responseType: "stream",
      timeout: 120000,
    });

    const filename = `vastu-report-${sessionId}.pdf`;

    // Google Drive me upload
    const uploadResponse = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
        mimeType: "application/pdf",
      },
      media: {
        mimeType: "application/pdf",
        body: pdfResponse.data,
      },
      fields: "id,name,size,mimeType,webViewLink,webContentLink",
    });

    const fileId = uploadResponse.data.id;

    // File ko public read access dena
    await drive.permissions.create({
      fileId,
      requestBody: {
        type: "anyone",
        role: "reader",
      },
    });

    // Permission update ke baad links dobara fetch karo
    const fileResponse = await drive.files.get({
      fileId,
      fields: "id,name,size,mimeType,webViewLink,webContentLink",
    });

    return {
      file_id: fileId,
      url:
        fileResponse.data.webViewLink ||
        `https://drive.google.com/file/d/${fileId}/view`,
      download_url:
        fileResponse.data.webContentLink ||
        `https://drive.google.com/uc?export=download&id=${fileId}`,
      filename: fileResponse.data.name || filename,
      size: fileResponse.data.size,
    };
  } catch (error) {
    console.error(
      "Google Drive upload error:",
      error.response?.data || error.message
    );

    throw new Error("Failed to upload PDF to Google Drive");
  }
}

module.exports = uploadPdfToDrive;