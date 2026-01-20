import mongoose, { model, Schema } from "mongoose";

const profileImageSchema = Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['profile', 'post', 'document'],
    required: true
  },
  sizes: {
    small: {
      url: String,
      key: String,  // S3 key for easier deletion
      size: Number  // File size in bytes
    },
    medium: {
      url: String,
      key: String,
      size: Number
    },
    large: {
      url: String,
      key: String,
      size: Number
    }
  },
  mimeType: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timeStamps: true });

export const ProfileImage = new model("ProfileImage", profileImageSchema);