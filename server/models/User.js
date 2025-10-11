// backend/server/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, index: true, sparse: true },
    passwordHash: { type: String },
    displayName: { type: String },
    avatar: { type: String },
    
    // OAuth fields
    googleId: { type: String, sparse: true, unique: true },
    githubId: { type: String, sparse: true, unique: true },
    
    oauthProvider: { type: String, default: null },
    oauthId: { type: String, default: null },
    
    // Email Verification
    isEmailVerified: { 
      type: Boolean, 
      default: false 
    },
    emailVerificationToken: { 
      type: String, 
      default: null,
      index: true 
    },
    emailVerificationExpires: { 
      type: Date, 
      default: null 
    },
    
    // Password Reset
    resetPasswordToken: { 
      type: String, 
      default: null,
      index: true 
    },
    resetPasswordExpires: { 
      type: Date, 
      default: null 
    },

    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

userSchema.methods.setPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(password, salt);
  return this;
};

userSchema.methods.verifyPassword = async function (password) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.createFromOAuth = async function ({ provider, oauthId, email, displayName, avatar }) {
  const User = this;
  
  let query = {};
  if (provider === 'google') {
    query = { googleId: oauthId };
  } else if (provider === 'github') {
    query = { githubId: oauthId };
  }
  
  let user = await User.findOne(query);
  if (user) return user;

  if (email) {
    user = await User.findOne({ email });
    if (user) {
      if (provider === 'google') user.googleId = oauthId;
      if (provider === 'github') user.githubId = oauthId;
      
      user.oauthProvider = provider;
      user.oauthId = oauthId;
      user.displayName = user.displayName || displayName;
      user.avatar = user.avatar || avatar;
      user.isEmailVerified = true; // OAuth users auto-verified
      await user.save();
      return user;
    }
  }

  const userData = {
    email: email || null,
    displayName: displayName || null,
    avatar: avatar || null,
    oauthProvider: provider,
    oauthId,
    isEmailVerified: true, // OAuth users auto-verified
  };
  
  if (provider === 'google') userData.googleId = oauthId;
  if (provider === 'github') userData.githubId = oauthId;

  user = await User.create(userData);
  return user;
};

module.exports = mongoose.model("User", userSchema);