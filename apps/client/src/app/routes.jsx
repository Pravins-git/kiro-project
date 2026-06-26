import { HomePage } from '../features/home/HomePage';
import { NotFoundPage } from '../shared/components/NotFoundPage';
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx';
import { AnalysisResultsPage } from '../features/resume/AnalysisResultsPage.jsx';
import { ChatPage } from '../features/chat/ChatPage.jsx';
import { CareerMatchesPage } from '../features/career/CareerMatchesPage.jsx';
import { AdminPanel } from '../features/admin/AdminPanel.jsx';
import { MarketIntelligencePage } from '../features/market/MarketIntelligencePage.jsx';
import { InterviewSimulatorPage } from '../features/interview/InterviewSimulatorPage.jsx';
import { CoverLetterPage } from '../features/cover-letter/CoverLetterPage.jsx';
import { NetworkPage } from '../features/network/NetworkPage.jsx';
import { AssessmentPage } from '../features/assessment/AssessmentPage.jsx';
import { NegotiationSimulatorPage } from '../features/negotiation/NegotiationSimulatorPage.jsx';
import { CareerPivotPage } from '../features/pivot/CareerPivotPage.jsx';
import { LinkedInOptimizerPage } from '../features/linkedin/LinkedInOptimizerPage.jsx';
import { ColdEmailPage } from '../features/email/ColdEmailPage.jsx';
import { OfferComparisonPage } from '../features/offer/OfferComparisonPage.jsx';
import { LearningRoadmapPage } from '../features/roadmap/LearningRoadmapPage.jsx';
import { LoginPage } from '../features/auth/components/LoginPage.jsx';
import { RegisterPage } from '../features/auth/components/RegisterPage.jsx';
import { ForgotPasswordPage } from '../features/auth/components/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from '../features/auth/components/ResetPasswordPage.jsx';
import { ProfilePage } from '../features/profile/ProfilePage.jsx';

export const routes = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
  },
  {
    path: '/profile',
    element: <ProfilePage />,
  },
  {
    path: '/analysis/:id',
    element: <AnalysisResultsPage />,
  },
  {
    path: '/chat',
    element: <ChatPage />,
  },
  {
    path: '/career-matches',
    element: <CareerMatchesPage />,
  },
  {
    path: '/admin',
    element: <AdminPanel />,
  },
  {
    path: '/market',
    element: <MarketIntelligencePage />,
  },
  {
    path: '/interview',
    element: <InterviewSimulatorPage />,
  },
  {
    path: '/cover-letter',
    element: <CoverLetterPage />,
  },
  {
    path: '/network',
    element: <NetworkPage />,
  },
  {
    path: '/assessment',
    element: <AssessmentPage />,
  },
  {
    path: '/negotiation',
    element: <NegotiationSimulatorPage />,
  },
  {
    path: '/career-pivot',
    element: <CareerPivotPage />,
  },
  {
    path: '/linkedin-optimizer',
    element: <LinkedInOptimizerPage />,
  },
  {
    path: '/cold-email',
    element: <ColdEmailPage />,
  },
  {
    path: '/offer-comparison',
    element: <OfferComparisonPage />,
  },
  {
    path: '/roadmap/:careerId',
    element: <LearningRoadmapPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];
