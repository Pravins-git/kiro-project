import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t border-border mt-32 py-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
              K
            </div>
            <span className="font-heading font-bold text-lg tracking-tight">Kiro.ai</span>
          </Link>
          <p className="text-text-muted text-sm max-w-sm">
            Discover your ideal career through AI, resume intelligence, and personalized learning roadmaps.
          </p>
        </div>
        
        <div>
          <h4 className="font-medium mb-4">Product</h4>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link to="#" className="hover:text-text-main">Features</Link></li>
            <li><Link to="#" className="hover:text-text-main">Pricing</Link></li>
            <li><Link to="#" className="hover:text-text-main">Career Explorer</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link to="#" className="hover:text-text-main">About</Link></li>
            <li><Link to="#" className="hover:text-text-main">Blog</Link></li>
            <li><Link to="#" className="hover:text-text-main">Contact</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-border text-sm text-text-muted flex justify-between items-center">
        <p>© {new Date().getFullYear()} Kiro AI. All rights reserved.</p>
        <div className="flex gap-4">
          <Link to="#" className="hover:text-text-main">Privacy Policy</Link>
          <Link to="#" className="hover:text-text-main">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};
