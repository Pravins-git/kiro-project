import { UserProfile, UpdateProfileRequest } from '@ai-career/shared';
import { User } from '../models/User.model.js';

export class ProfileService {
  static async getProfile(userId: string): Promise<UserProfile> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      userId: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as any,
      profileCompleteness: user.profileCompleteness || 0,
      createdAt: (user as any).createdAt?.toISOString() || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: user.mfaEnabled,
      notificationPreferences: {
        careerUpdates: true,
        learningReminders: true,
        interviewReminders: true,
        roadmapUpdates: true,
        systemAnnouncements: true,
      },
      phoneNumber: user.phoneNumber || undefined,
      dateOfBirth: user.dateOfBirth || undefined,
      location: user.location || undefined,
      educationLevel: user.educationLevel || undefined,
      careerInterests: user.careerInterests || undefined,
      profilePhotoUrl: user.profilePhotoUrl || undefined,
      version: user.version,
    };
  }

  static async updateProfile(userId: string, data: UpdateProfileRequest): Promise<UserProfile> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.phoneNumber) user.phoneNumber = data.phoneNumber;
    if (data.dateOfBirth) user.dateOfBirth = data.dateOfBirth;
    if (data.location) user.location = data.location;
    if (data.educationLevel) user.educationLevel = data.educationLevel;
    if (data.careerInterests) user.careerInterests = data.careerInterests;

    // Calculate completeness
    let completeness = 20; // Base: email, password, name
    if (user.phoneNumber) completeness += 10;
    if (user.location) completeness += 10;
    if (user.educationLevel) completeness += 20;
    if (user.careerInterests && user.careerInterests.length > 0) completeness += 20;
    if (user.profilePhotoUrl) completeness += 20;
    
    user.profileCompleteness = Math.min(100, completeness);
    await user.save();

    return this.getProfile(userId);
  }
}
