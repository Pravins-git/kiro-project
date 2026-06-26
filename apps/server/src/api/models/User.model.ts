import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: {
      type: String,
      enum: ['Student', 'Recruiter', 'Career Counselor', 'College Admin', 'Platform Admin'],
      default: 'Student',
    },
    isVerified: { type: Boolean, default: false },
    profileCompleteness: { type: Number, default: 0 },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    emailVerificationToken: { type: String },
    phoneNumber: { type: String },
    dateOfBirth: { type: String },
    location: { type: String },
    educationLevel: { type: String },
    careerInterests: [{ type: String }],
    profilePhotoUrl: { type: String },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
