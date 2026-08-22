const UserSubmission = require("../models/UserSubmission");
const drive = require("../config/googleDrive");

async function cleanupExpiredPdfs() {
  try {
    console.log("Starting expired PDFs cleanup task...");
    
    // Find all submissions where expires_at is in the past, is_deleted is false, and has a file_id
    const expiredReports = await UserSubmission.find({
      "pdf_report.expires_at": { $lte: new Date() },
      "pdf_report.is_deleted": false,
      "pdf_report.file_id": { $exists: true, $ne: null }
    });

    console.log(`Found ${expiredReports.length} expired Vastu PDF reports to delete.`);

    for (const report of expiredReports) {
      const fileId = report.pdf_report.file_id;
      try {
        console.log(`Deleting file ${fileId} (${report.pdf_report.filename}) from Google Drive...`);
        
        // Delete the file from Google Drive
        await drive.files.delete({
          fileId: fileId
        });

        // Update database record
        report.pdf_report.is_deleted = true;
        report.pdf_report.deleted_at = new Date();
        report.pdf_url = null; // Clear the public URL
        await report.save();

        console.log(`Successfully deleted and updated db for session: ${report.session_id}`);
      } catch (driveError) {
        // If file is already deleted on Drive or doesn't exist (404), mark it as deleted in DB anyway to avoid infinite loops
        if (driveError.code === 404 || driveError.message?.includes("File not found")) {
          console.warn(`File ${fileId} not found on Drive. Marking as deleted in DB.`);
          report.pdf_report.is_deleted = true;
          report.pdf_report.deleted_at = new Date();
          report.pdf_url = null;
          await report.save();
        } else {
          console.error(`Error deleting file ${fileId} from Drive:`, driveError.message || driveError);
        }
      }
    }
    
    console.log("Cleanup task finished.");
  } catch (err) {
    console.error("Error in PDF cleanup task:", err);
  }
}

function startCleanupScheduler() {
  // Run cleanup task immediately on startup
  cleanupExpiredPdfs();

  // Run cleanup task every 24 hours (24 * 60 * 60 * 1000 ms)
  setInterval(cleanupExpiredPdfs, 24 * 60 * 60 * 1000);
  console.log("Automated 10-day PDF cleanup scheduler initialized.");
}

module.exports = {
  cleanupExpiredPdfs,
  startCleanupScheduler
};
