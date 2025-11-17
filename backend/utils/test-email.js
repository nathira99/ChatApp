require("dotenv").config();
const sendEmail = require("./sendEmail");

sendEmail(
  process.env.EMAIL_FROM,
  "Test from Brevo",
  "<h2>Hello! Brevo SMTP works.</h2>"
);