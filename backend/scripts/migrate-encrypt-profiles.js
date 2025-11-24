/*
  Migration script: Encrypt existing plaintext profile.bio and profile.publicEmail
  Usage: set necessary env vars (MONGODB_URI, ENCRYPTION_KEY), then run:
    node scripts/migrate-encrypt-profiles.js
*/

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { encrypt } = require('../services/encryptionService');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dev_portfolio';
  console.log('Connecting to DB:', uri);
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    const users = await User.find({
      $or: [
        { 'profile.bio': { $exists: true, $ne: null, $ne: '' } },
        { 'profile.publicEmail': { $exists: true, $ne: null, $ne: '' } }
      ]
    });

    console.log('Found', users.length, 'users to check');

    let updated = 0;
    for (const u of users) {
      let changed = false;

      if (u.profile && u.profile.bio && !u.profile.bioEncrypted) {
        try {
          const encrypted = encrypt(u.profile.bio);
          u.profile.bioEncrypted = encrypted;
          u.profile.bio = undefined;
          changed = true;
        } catch (err) {
          console.error('Failed to encrypt bio for user', u._id, err.message);
        }
      }

      if (u.profile && u.profile.publicEmail && !u.profile.publicEmailEncrypted) {
        try {
          const encryptedEmail = encrypt(u.profile.publicEmail);
          u.profile.publicEmailEncrypted = encryptedEmail;
          u.profile.publicEmail = undefined;
          changed = true;
        } catch (err) {
          console.error('Failed to encrypt publicEmail for user', u._id, err.message);
        }
      }

      if (changed) {
        await u.save();
        updated++;
        console.log('Updated user', u._id);
      }
    }

    console.log('Migration complete. Users updated:', updated);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
