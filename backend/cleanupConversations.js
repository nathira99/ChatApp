const mongoose = require("mongoose");
const User = require("./models/User");
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");

const MONGO = "mongodb://localhost:27017/chatapp"; // change if needed

async function cleanDB() {
  await mongoose.connect(MONGO);
  console.log("Connected");

  // ---- CLEAN MESSAGES ----
  const messages = await Message.find();
  let removedMsg = 0;

  for (const m of messages) {
    const s = m.sender ? await User.findById(m.sender) : null;
    const r = m.receiver ? await User.findById(m.receiver) : null;

    if (!s || (!r && !m.group)) {
      await m.deleteOne();
      removedMsg++;
    }
  }

  // ---- CLEAN CONVERSATIONS ----
  const convos = await Conversation.find();
  let removedConvo = 0;

  for (const c of convos) {
    if (c.isGroup) continue;

    if (!Array.isArray(c.members) || c.members.length !== 2) {
      await c.deleteOne();
      removedConvo++;
      continue;
    }

    const [u1, u2] = c.members;
    const user1 = await User.findById(u1);
    const user2 = await User.findById(u2);

    if (!user1 || !user2) {
      await c.deleteOne();
      removedConvo++;
    }
  }

  console.log(`Cleanup done.`);
  console.log(`Deleted ${removedMsg} bad messages.`);
  console.log(`Deleted ${removedConvo} bad conversations.`);
  process.exit();
}

cleanDB();