const axios = require("axios");
const cloudinary = require("cloudinary").v2;

async function uploadPdfFromUrlToCloudinary(pdfUrl, sessionId) {
  const pdfResponse = await axios({
    method: "GET",
    url: pdfUrl,
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "vastu/reports",
        resource_type: "raw",
        public_id: `report-${sessionId}`,
        format: "pdf",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    pdfResponse.data.pipe(uploadStream);
  });
}

module.exports = uploadPdfFromUrlToCloudinary;