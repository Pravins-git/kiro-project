export type UserRole = 'Student' | 'Recruiter' | 'Career Counselor' | 'College Admin' | 'Platform Admin';

export interface NotificationPreferences {
  careerUpdates: boolean;
  learningReminders: boolean;
  interviewReminders: boolean;
  roadmapUpdates: boolean;
  systemAnnouncements: boolean;
}

export interface UserProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileCompleteness: number;
  createdAt: string;
  lastLoginAt: string;
  mfaEnabled: boolean;
  notificationPreferences: NotificationPreferences;
  phoneNumber?: string;
  dateOfBirth?: string;
  location?: string;
  educationLevel?: string;
  careerInterests?: string[];
  profilePhotoUrl?: string;
  version: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  userId: string;
  message: string;
  verificationEmailSent: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyMfaRequest {
  userId: string;
  token: string;
}

export interface EnableMfaResponse {
  secret: string;
  qrCodeUrl: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  location?: string;
  educationLevel?: string;
  careerInterests?: string[];
  notificationPreferences?: Partial<NotificationPreferences>;
}
