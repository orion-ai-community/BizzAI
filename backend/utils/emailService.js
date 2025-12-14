import nodemailer from "nodemailer";

/**
 * Sends an email with optional attachment (invoice PDF, etc.)
 * @param {String} to
 * @param {String} subject
 * @param {String} text
 * @param {String} attachmentPath (optional)
 */
export const sendEmail = async (to, subject, text, attachmentPath = null) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Grocery Billing" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      attachments: attachmentPath
        ? [{ filename: "invoice.pdf", path: attachmentPath }]
        : [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📨 Email sent:", info.response);
    return true;
  } catch (error) {
    console.error("Email Error:", error);
    return false;
  }
};
