const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  try {
    const from = process.env.EMAIL_FROM;
    if (!from) throw new Error("EMAIL_FROM missing");

    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    console.log("📧 Resend email sent:", data);
    return data;
  } catch (err) {
    console.error("❌ Email error:", err);
    throw err;
  }
};

module.exports = sendEmail;

// const nodemailer = require("nodemailer");

// const sendEmail = async (to, subject, html) => {
//   const user = process.env.SMTP_USER;
//   const pass = process.env.SMTP_PASS;

//   if (!user || !pass) {
//     throw new Error("Email credentials missing — check .env");
//   }

//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT),
//     secure: false,
//     auth: {
//       user,
//       pass,
//     },
//   });

//   await transporter.sendMail({
//     from: `"ChatApp Team" <${user}>`,
//     to,
//     subject,
//     html, // ✅ send HTML content properly
//     text: "If you cannot view this email, please copy and paste the link into your browser.",
//   });

//   console.log("📧 Email sent successfully to:", to);
// };

// module.exports = sendEmail;
