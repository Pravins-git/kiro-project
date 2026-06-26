import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useResetPasswordMutation } from '../authApi';
import { Button } from '../../../shared/components/Button';
import { GradientText } from '../../../shared/components/GradientText';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await resetPassword({ token, newPassword: password }).unwrap();
      setStatusMessage(res.message);
      setIsSuccess(true);
    } catch (err) {
      setStatusMessage(err.data?.error || 'An error occurred.');
      setIsSuccess(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 glass rounded-2xl border border-white/10"
      >
        <h2 className="text-3xl font-heading font-bold mb-6 text-center">
          Set New <GradientText>Password</GradientText>
        </h2>
        {isSuccess ? (
          <div className="text-center">
            <p className="text-text-main mb-6">{statusMessage}</p>
            <Link to="/login">
              <Button variant="primary" className="w-full">Return to Login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {statusMessage && <p className="text-red-400 text-sm">{statusMessage}</p>}
            {!token ? (
              <p className="text-red-400 text-sm">Invalid or missing token.</p>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">New Password</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-surface-50 border border-white/5 focus:border-primary-500 focus:outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                
                <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </>
            )}
          </form>
        )}
      </motion.div>
    </div>
  );
};
