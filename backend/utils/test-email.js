require("dotenv").config();
const sendEmail = require("./sendEmail");

sendEmail("nathirafarveen99@gmail.com", "Test", "<h1>Hello</h1>")
  .then(() => console.log("Email sent"))
  .catch(err => console.error("ERROR:", err));