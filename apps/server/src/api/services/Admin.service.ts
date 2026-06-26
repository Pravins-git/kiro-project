import { User } from '../models/User.model.js';
import { Resume } from '../models/Resume.model.js';
import { ChatSession } from '../models/ChatSession.model.js';

export class AdminService {
  static async getDashboardMetrics() {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    
    const totalResumes = await Resume.countDocuments();
    const processedResumes = await Resume.countDocuments({ status: 'complete' });

    const totalChatSessions = await ChatSession.countDocuments();

    return {
      totalUsers,
      verifiedUsers,
      totalResumes,
      processedResumes,
      totalChatSessions,
    };
  }

  static async getUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const users = await User.find({}, '-password').skip(skip).limit(limit).sort({ createdAt: -1 });
    const total = await User.countDocuments();

    return {
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      }
    };
  }

  static async deleteUser(userId: string) {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new Error('User not found');
    }
    // Delete associated data
    await Resume.deleteMany({ userId });
    await ChatSession.deleteMany({ userId });
    return { success: true };
  }
}
