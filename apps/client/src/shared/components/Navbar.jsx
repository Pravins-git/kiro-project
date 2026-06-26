import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { GradientText } from './GradientText';

export const Navbar = () => {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b-0 border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl">
            K
          </div>
          <span className="font-heading font-bold text-xl tracking-tight">
            Kiro<GradientText as="span">.ai</GradientText>
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
          <Link to="#features" className="hover:text-text-main transition-colors">Features</Link>
          <Link to="#how-it-works" className="hover:text-text-main transition-colors">How it works</Link>
          <Link to="#pricing" className="hover:text-text-main transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">Get Started</Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};
