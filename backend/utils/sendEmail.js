const axios = require("axios");

const sendEmail = async (to, subject, html) => {
  const apiKey = process.env.BREVO_KEY;

  const res = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { email: process.env.EMAIL_FROM, name: "ChatApp" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    },
    {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data;
};

module.exports = sendEmail;