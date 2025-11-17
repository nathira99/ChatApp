const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, subject, html) {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY in .env");
    }
    if (!process.env.EMAIL_FROM) {
      throw new Error("Missing EMAIL_FROM in .env");
    }

    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log("📧 Resend email sent:", response);
    return response;
  } catch (err) {
    console.error("❌ Resend email error:", err);
    throw err;
  }
}

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
