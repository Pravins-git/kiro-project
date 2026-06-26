import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForgotPasswordMutation } from '../authApi';
import { Button } from '../../../shared/components/Button';
import { GradientText } from '../../../shared/components/GradientText';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await forgotPassword({ email }).unwrap();
      setStatusMessage(res.message);
    } catch (err) {
      setStatusMessage('An error occurred. Please try again.');
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
          Reset <GradientText>Password</GradientText>
        </h2>
        {statusMessage ? (
          <div className="text-center">
            <p className="text-text-main mb-6">{statusMessage}</p>
            <Link to="/login">
              <Button variant="primary" className="w-full">Return to Login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-text-muted mb-4">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-surface-50 border border-white/5 focus:border-primary-500 focus:outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>
            
            <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending link...' : 'Send Reset Link'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-muted">
          Remember your password? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};
