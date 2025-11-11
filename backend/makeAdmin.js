const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

async function makeAdmin() {
  try {
    // connect to your database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const email = "nathirafarveen99@gmail.com";

    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ No user found with that email");
      process.exit(0);
    }

    user.isAdmin = true;
    await user.save();

    console.log(`✅ ${user.name} is now an admin`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

makeAdmin();
