
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: null
  },
  emailVerified: {
    type: Date,
    default: null
  },
  plan: {
    type: String,
    enum: ['free', 'premium', 'ultimate'],
    default: 'free'
  },
  messagesRemaining: {
    type: Number,
    default: 30
  },
  totalCredits: {
    type: Number,
    default: 0
  },
  lastMessageReset: {
    type: Date,
    default: Date.now
  },
  subscriptionId: {
    type: String,
    default: null
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'failed'],
    default: null
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
