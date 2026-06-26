import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { useLoginMutation, useGoogleLoginMutation } from '../authApi';
import { setCredentials } from '../authSlice';
import { Button } from '../../../shared/components/Button';
import { GradientText } from '../../../shared/components/GradientText';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const [googleLogin] = useGoogleLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login({ email, password }).unwrap();
      dispatch(setCredentials({ user: user.user, token: user.accessToken }));
      navigate('/dashboard');
    } catch (err) {
      alert('Login failed: ' + (err.data?.error || 'Unknown error'));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // In a real app we would use Google Login SDK to get the idToken
      const idToken = 'mock_google_id_token'; 
      const user = await googleLogin({ idToken }).unwrap();
      dispatch(setCredentials({ user: user.user, token: user.accessToken }));
      navigate('/dashboard');
    } catch (err) {
      alert('Google Login failed: ' + (err.data?.error || 'Unknown error'));
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
          Welcome back to <GradientText>Kiro</GradientText>
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-surface-50 border border-white/5 focus:border-primary-500 focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>
          <div className="flex justify-between items-center text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-white/10 bg-surface-50 text-primary-500 focus:ring-primary-500" />
              <span className="text-text-muted">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-primary-400 hover:text-primary-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log in'}
          </Button>
        </form>
        
        <div className="mt-6 flex items-center gap-4">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Or continue with</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <Button 
          type="button" 
          variant="ghost" 
          className="w-full mt-6 bg-white/5 hover:bg-white/10"
          onClick={handleGoogleLogin}
        >
          Google
        </Button>

        <p className="mt-6 text-center text-sm text-text-muted">
          Don&apos;t have an account? <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
};
