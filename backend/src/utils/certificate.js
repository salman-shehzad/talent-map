const PDFDocument = require("pdfkit");

function createCertificatePdf(application) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 72 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc
      .fontSize(16)
      .text("SMART STUDENT CLEARANCE & DEGREE ISSUANCE SYSTEM", { align: "center" })
      .moveDown(1.5)
      .fontSize(28)
      .text("Digital Degree Certificate", { align: "center" })
      .moveDown(1.5)
      .fontSize(15)
      .text(`This is to certify that ${application.fullName}`, { align: "center" })
      .moveDown(0.5)
      .text(`Registration No. ${application.registrationNo}`, { align: "center" })
      .moveDown(0.5)
      .text(`Program: ${application.program}`, { align: "center" })
      .moveDown(1.5)
      .text("has successfully completed all clearance requirements", { align: "center" })
      .moveDown(0.5)
      .text("and is approved for degree issuance.", { align: "center" })
      .moveDown(2)
      .fontSize(12)
      .text(`Issued At: ${new Date(application.certificateIssuedAt).toLocaleString()}`)
      .text(`Verification ID: ${application._id}`);

    doc.end();
  });
}

module.exports = createCertificatePdf;
