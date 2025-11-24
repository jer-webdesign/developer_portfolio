const mongoose = require('mongoose');
const path = require('path');

(async function main() {
  try {
    // load env from project root .env if present
    require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

    const mongo = process.env.MONGODB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost:27017/dev_portfolio';
    console.log('Connecting to DB:', mongo);
    await mongoose.connect(mongo, { /* useNewUrlParser/unifiedTopology are defaults in modern drivers */ });

    // Require the User model relative to backend folder
    const User = require(path.resolve(__dirname, '..', 'models', 'User'));

    const bioPlain = await User.find({ 'profile.bio': { $exists: true, $ne: '' }, 'profile.bioEncrypted': { $exists: false } }).lean();
    const emailPlain = await User.find({ 'profile.publicEmail': { $exists: true, $ne: '' }, 'profile.publicEmailEncrypted': { $exists: false } }).lean();

    console.log('bio plaintext users:', bioPlain.length);
    if (bioPlain.length > 0) console.log(bioPlain.map(u => ({ _id: u._id, email: u.email })).slice(0, 20));

    console.log('publicEmail plaintext users:', emailPlain.length);
    if (emailPlain.length > 0) console.log(emailPlain.map(u => ({ _id: u._id, email: u.email })).slice(0, 20));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error checking plaintext profiles:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
})();
