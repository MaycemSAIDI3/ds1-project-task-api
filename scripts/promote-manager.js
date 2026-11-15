require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

// El promotion tet3amel localement, ma famech route publique lel role.
async function main() {
  const login = process.argv[2];
  if (!login || process.argv.length !== 3) throw new Error('Usage: npm run manager -- LOGIN');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    const user = await User.findOne({ login: login.trim().toLowerCase() });
    if (!user) throw new Error('Register this user before promoting them.');
    user.role = 'manager';
    await user.save();
    console.log(`Manager role enabled for ${user.login}.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
