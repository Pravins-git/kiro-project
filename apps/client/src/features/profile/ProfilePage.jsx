import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGetProfileQuery, useUpdateProfileMutation } from './profileApi';
import { Button } from '../../shared/components/Button';
import { GradientText } from '../../shared/components/GradientText';

export const ProfilePage = () => {
  const { data: profile, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    location: '',
    educationLevel: '',
    careerInterests: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phoneNumber: profile.phoneNumber || '',
        location: profile.location || '',
        educationLevel: profile.educationLevel || '',
        careerInterests: profile.careerInterests?.join(', ') || ''
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        careerInterests: formData.careerInterests.split(',').map(s => s.trim()).filter(Boolean)
      };
      await updateProfile(submitData).unwrap();
      alert('Profile updated successfully');
    } catch (err) {
      alert('Failed to update profile: ' + (err.data?.error || 'Unknown error'));
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-text-muted">Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 mt-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 border border-white/10"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold">
              Your <GradientText>Profile</GradientText>
            </h1>
            <p className="text-text-muted mt-2">Manage your personal information and career preferences</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-text-muted mb-1">Profile Completeness</div>
            <div className="w-32 h-2 bg-surface-50 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-1000"
                style={{ width: `${profile?.profileCompleteness || 0}%` }}
              ></div>
            </div>
            <div className="text-xs font-medium text-primary-400 mt-1">{profile?.profileCompleteness || 0}%</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">First Name</label>
              <input 
                type="text" 
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-surface-50 border border-white/5 focus:border-primary-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Last Name</label>
              <input 
                type="text" 
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-surface-50 border border-white/5 focus:border-primary-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Phone Number</label>
              <input 
                type="tel" 
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-surface-50 border border-white/5 focus:border-primary-500 focus:outline-none transition-colors"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Location</label>
              <input 
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-surface-50 border border-white/5 focus:border-primary-500 focus:outline-none transition-colors"
                placeholder="City, Country"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Education Level</label>
              <select 
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-surface-50 border border-white/5 focus:border-primary-500 focus:outline-none transition-colors text-white"
              >
                <option value="">Select Level</option>
                <option value="High School">High School</option>
                <option value="Associate Degree">Associate Degree</option>
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="Doctorate">Doctorate</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Career Interests (comma separated)</label>
              <input 
                type="text" 
                name="careerInterests"
                value={formData.careerInterests}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-surface-50 border border-white/5 focus:border-primary-500 focus:outline-none transition-colors"
                placeholder="Software Engineering, Data Science..."
              />
            </div>
          </div>
          
          <div className="pt-6 border-t border-white/5 flex justify-end">
            <Button type="submit" variant="primary" disabled={isUpdating}>
              {isUpdating ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
