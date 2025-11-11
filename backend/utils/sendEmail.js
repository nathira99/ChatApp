const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("Email credentials missing — check .env");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"ChatApp Team" <${user}>`,
    to,
    subject,
    html, // ✅ send HTML content properly
    text: "If you cannot view this email, please copy and paste the link into your browser.",
  });

  console.log("📧 Email sent successfully to:", to);
};

module.exports = sendEmail;
