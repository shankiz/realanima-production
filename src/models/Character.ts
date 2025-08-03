
import mongoose from 'mongoose';

const CharacterSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  context: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const Character = mongoose.models.Character || mongoose.model('Character', CharacterSchema);
