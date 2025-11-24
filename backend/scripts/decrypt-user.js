const mongoose = require('mongoose');
const path = require('path');

(async function main() {
  try {
    // allow email or id via argv: node decrypt-user.js --email=email@x.com OR --id=USERID
    const argv = require('minimist')(process.argv.slice(2));
    const email = argv.email || argv.e;
    const id = argv.id || argv.i;

    require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
    const mongo = process.env.MONGODB_URI || 'mongodb://localhost:27017/dev_portfolio';
    console.log('Connecting to DB:', mongo);
    await mongoose.connect(mongo);

    const User = require(path.resolve(__dirname, '..', 'models', 'User'));
    const { decrypt } = require(path.resolve(__dirname, '..', 'services', 'encryptionService'));

    let user;
    if (email) user = await User.findOne({ email }).lean();
    else if (id) user = await User.findById(id).lean();
    else {
      console.error('Provide --email or --id');
      process.exit(2);
    }

    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    console.log('User:', { _id: user._id, username: user.username, email: user.email, role: user.role });

    if (user.profile) {
      console.log('Stored profile keys:', Object.keys(user.profile));
      if (user.profile.bioEncrypted) {
        try {
          console.log('bio (decrypted):', decrypt(user.profile.bioEncrypted));
        } catch (err) {
          console.error('Failed to decrypt bio:', err.message);
        }
      } else if (user.profile.bio) {
        console.log('bio (plaintext):', user.profile.bio);
      } else {
        console.log('No bio stored');
      }

      if (user.profile.publicEmailEncrypted) {
        try {
          console.log('publicEmail (decrypted):', decrypt(user.profile.publicEmailEncrypted));
        } catch (err) {
          console.error('Failed to decrypt publicEmail:', err.message);
        }
      } else if (user.profile.publicEmail) {
        console.log('publicEmail (plaintext):', user.profile.publicEmail);
      } else {
        console.log('No publicEmail stored');
      }
    } else {
      console.log('No profile object on user');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
})();
