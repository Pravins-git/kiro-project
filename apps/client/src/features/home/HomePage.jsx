import { motion } from 'framer-motion';
import { Button, Card, GradientText } from '../../shared/components';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Resume Intelligence',
    description: 'Our AI engine parses your resume to extract skills, project impacts, and leadership qualities with 99% accuracy.',
    icon: '📄',
    colSpan: 'col-span-1 md:col-span-2'
  },
  {
    title: 'Behavioral Analysis',
    description: 'Conversational AI uncovers your unique communication style and personality indicators.',
    icon: '🧠',
    colSpan: 'col-span-1'
  },
  {
    title: 'Evidence-based Matching',
    description: 'Recommendations backed by market data and explainable AI logic with high confidence scores.',
    icon: '🎯',
    colSpan: 'col-span-1'
  },
  {
    title: 'Personalized Learning',
    description: 'Targeted skill gap analysis and custom learning roadmaps to guarantee career success.',
    icon: '🚀',
    colSpan: 'col-span-1 md:col-span-2'
  },
];

const steps = [
  { step: '01', title: 'Upload Resume', desc: 'Securely upload your PDF or DOCX file. Our AI instantly parses your history.' },
  { step: '02', title: 'AI Interview', desc: 'Chat with our AI mentor to uncover your hidden soft skills and goals.' },
  { step: '03', title: 'Discover Path', desc: 'Receive evidence-based career recommendations with confidence scores.' },
  { step: '04', title: 'Level Up', desc: 'Follow your personalized learning roadmap to bridge skill gaps.' },
];

export function HomePage() {
  return (
    <div className="relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-hero-glow -z-10 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-primary-300 font-medium mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            V1.0 is now live
          </motion.div>
          
          <h1 className="font-heading font-extrabold text-5xl md:text-7xl tracking-tight leading-tight mb-8">
            Discover Your Perfect Career Path Using <GradientText>AI Intelligence</GradientText>
          </h1>
          
          <p className="text-lg md:text-xl text-text-muted mb-12 max-w-2xl mx-auto leading-relaxed">
            Stop guessing your future. Our enterprise-grade AI analyzes your resume, skills, and behavioral signals to recommend your ideal tech career with mathematical precision.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto text-lg">Start Free Assessment</Button>
            </Link>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto text-lg">View Demo</Button>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-surface2/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Careers Mapped', value: '500+' },
            { label: 'AI Accuracy', value: '98.5%' },
            { label: 'Success Rate', value: '92%' },
            { label: 'Active Users', value: '10k+' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-heading font-bold text-white mb-2">{stat.value}</div>
              <div className="text-sm text-text-muted uppercase tracking-wider font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Bento Box */}
      <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-heading font-bold text-4xl md:text-5xl mb-6">Beyond Keyword Matching</h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">We combine advanced language models with deep behavioral analytics to understand who you truly are as a professional.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className={`${feature.colSpan} flex flex-col justify-between overflow-hidden relative group`}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="text-4xl mb-6">{feature.icon}</div>
                <h3 className="font-heading font-bold text-2xl mb-4">{feature.title}</h3>
                <p className="text-text-muted leading-relaxed">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-32 px-6 max-w-7xl mx-auto border-t border-border">
        <div className="mb-20">
          <h2 className="font-heading font-bold text-4xl md:text-5xl mb-6">How It Works</h2>
          <p className="text-text-muted text-lg max-w-2xl">From upload to job offer, we guide you every step of the way.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="relative"
            >
              <div className="text-5xl font-heading font-black text-white/5 mb-6">{step.step}</div>
              <h4 className="font-bold text-xl mb-3 text-primary-200">{step.title}</h4>
              <p className="text-text-muted text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
