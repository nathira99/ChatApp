const sgMail = require("@sendgrid/mail");

const sendEmail = async (to, subject, html) => {
  try {
    const apiKey = process.env.SENDGRID_KEY;
    if (!apiKey) throw new Error("SENDGRID_KEY missing");

    sgMail.setApiKey(apiKey);

    const msg = {
      to,
      from: process.env.EMAIL_FROM, // must be the verified Gmail in SendGrid
      subject,
      html,
    };

    const result = await sgMail.send(msg);
    console.log("📧 SendGrid email sent:", result[0].statusCode);

    return { status: "sent", code: result[0].statusCode };
  } catch (err) {
    console.error("❌ SendGrid error:", err);
    throw err;
  }
};

module.exports = sendEmail;