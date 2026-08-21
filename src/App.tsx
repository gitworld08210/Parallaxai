import { lazy, Suspense, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { AppShell } from "@/components/layout/AppShell";
import { AppLoadingScreen } from "@/components/layout/AppLoadingScreen";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { CallProvider } from "@/contexts/CallProvider";
import MessagesPasscodeGate from "@/components/messages/MessagesPasscodeGate";
import useNativeApp from "@/hooks/useNativeApp";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Eager: critical first-paint routes
const Feed = lazy(() => import("./pages/Feed"));
const Auth = lazy(() => import("./pages/Auth"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));

// Lazy: everything else streams in on demand
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Reels = lazy(() => import("./pages/Reels"));
const Discover = lazy(() => import("./pages/Discover"));
const Messages = lazy(() => import("./pages/Messages"));
const Conversation = lazy(() => import("./pages/Conversation"));
const Notifications = lazy(() => import("./pages/Notifications"));
const InviteAccept = lazy(() => import("./pages/InviteAccept"));
const CollabInviteAccept = lazy(() => import("./pages/CollabInviteAccept"));
const Compose = lazy(() => import("./pages/Compose"));
const ReelCompose = lazy(() => import("./pages/ReelCompose"));
const StoryCompose = lazy(() => import("./pages/StoryCompose"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const Tag = lazy(() => import("./pages/Tag"));
const Wallet = lazy(() => import("./pages/Wallet"));
const WalletHome = lazy(() => import("./pages/Wallet")); // Placeholder fallback
const WalletAnalytics = lazy(() => import("./pages/Wallet"));
const WalletTransactions = lazy(() => import("./pages/Wallet"));
const WalletPassport = lazy(() => import("./pages/Wallet"));
const WalletCoins = lazy(() => import("./pages/Wallet"));
const WalletGift = lazy(() => import("./pages/Wallet"));
const WalletWithdraw = lazy(() => import("./pages/Wallet"));
const WalletQR = lazy(() => import("./pages/Wallet"));
const WalletSecurity = lazy(() => import("./pages/Wallet"));
const WalletCardPage = lazy(() => import("./pages/Wallet"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Premium = lazy(() => import("./pages/Premium"));
const Verification = lazy(() => import("./pages/Verification"));
const Support = lazy(() => import("./pages/Support"));
const FollowList = lazy(() => import("./pages/FollowList"));
const Assistant = lazy(() => import("./pages/Assistant"));
const Drafts = lazy(() => import("./pages/Drafts"));
const PostInsights = lazy(() => import("./pages/PostInsights"));
const CloseFriends = lazy(() => import("./pages/CloseFriends"));
const FounderChronicle = lazy(() => import("./pages/FounderChronicle"));
const HallOfFoundersScreen = lazy(() =>
  import("./components/founders/HallOfFoundersScreen").then((m) => ({ default: m.HallOfFoundersScreen }))
);
const FounderCouncilScreen = lazy(() =>
  import("./components/founders/FounderCouncilScreen").then((m) => ({ default: m.FounderCouncilScreen }))
);
const Settings = lazy(() => import("./pages/Settings"));
const TwoFactorSetup = lazy(() => import("./pages/security/TwoFactorSetup"));
const LoginActivityScreen = lazy(() => import("./pages/security/LoginActivityScreen"));
const PrivacyScreen = lazy(() => import("./pages/security/PrivacyScreen"));
const BlockedListScreen = lazy(() => import("./pages/security/BlockedListScreen"));
const DataExportScreen = lazy(() => import("./pages/security/DataExportScreen"));
const DeleteAccountScreen = lazy(() => import("./pages/security/DeleteAccountScreen"));
const ChangePasswordScreen = lazy(() => import("./pages/security/ChangePasswordScreen"));
const ChangeEmailScreen = lazy(() => import("./pages/security/ChangeEmailScreen"));
const ChangePhoneScreen = lazy(() => import("./pages/security/ChangePhoneScreen"));
const ProfileCreation = lazy(() => import("./pages/ProfileCreation"));

// Aurelix Ads Manager
const AdsLayout = lazy(() => import("./pages/ComingSoon"));
const AdsBusinessCenter = lazy(() => import("./pages/ComingSoon"));
const AdsDashboard = lazy(() => import("./pages/ComingSoon"));
const AdsManager = lazy(() => import("./pages/ComingSoon"));
const AdsCampaignWizard = lazy(() => import("./pages/ComingSoon"));
const AdsCreatives = lazy(() => import("./pages/ComingSoon"));
const AdsBilling = lazy(() => import("./pages/ComingSoon"));
const AdsReviewQueue = lazy(() => import("./pages/ComingSoon"));
const AdsFinanceConsole = lazy(() => import("./pages/ComingSoon"));
const FinPaymentOperations = lazy(() => import("./pages/ComingSoon"));


const CreatorHub = lazy(() => import("./pages/CreatorHub"));
const CreatorStudio = lazy(() => import("./pages/CreatorStudio"));
const CreatorNews = lazy(() => import("./pages/CreatorNews"));
const Analytics = lazy(() => import("./pages/Analytics"));
const LiveList = lazy(() => import("./pages/LiveList"));
const LiveHost = lazy(() => import("./pages/LiveHost"));
const LiveViewer = lazy(() => import("./pages/LiveViewer"));
const Achievements = lazy(() => import("./pages/Achievements"));
const AuraLevel = lazy(() => import("./pages/AuraLevel"));
const Monetization = lazy(() => import("./pages/Monetization"));
const VerificationCenter = lazy(() => import("./pages/VerificationCenter"));
const AdminOSVerificationQueue = lazy(() => import("./pages/admin-os/VerificationQueue"));
const VirtualWorld = lazy(() => import("./pages/VirtualWorld"));
const Store = lazy(() => import("./pages/Store"));
const CheckoutReturn = lazy(() => import("./pages/CheckoutReturn"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Certificate = lazy(() => import("./pages/Certificate"));
const CreatorTerms = lazy(() => import("./pages/CreatorTerms"));
import { CreatorGate } from "@/components/creator/CreatorGate";
const ContentClassificationQueue = lazy(() => import("./pages/ComingSoon"));
const ReviewerWorkspace = lazy(() => import("./pages/ComingSoon"));

// Admin OS workspace (Phase 1 foundation)
const AdminOSGate = lazy(() => import("@/components/ProtectedRoute").then(m => ({ default: m.AdminOSGate })));
const AdminOSLayout = lazy(() => import("@/components/organization/layout/OrganizationLayout")); // Using existing shell for consistency
const AdminOSDashboard = lazy(() => import("./pages/admin-os/AdminOSDashboard"));
const AppointmentsPanel = lazy(() => import("./pages/admin-os/AppointmentsPanel"));
const RoutingOverview = lazy(() => import("./pages/ComingSoon"));
const ApprovalsInbox = lazy(() => import("./pages/admin-os/ApprovalsInbox"));
const FinanceDepartment = lazy(() => import("./pages/admin-os/FinanceDepartment"));
const AdminOSModulePlaceholder = lazy(() => import("./pages/ComingSoon"));
const AdminOSNoAccess = lazy(() => import("./pages/ComingSoon"));
const AdminOSFirstLogin = lazy(() => import("./pages/ComingSoon"));
const PeopleOpsIndex = lazy(() => import("./pages/ComingSoon"));
const EmployeeDetailPage = lazy(() => import("./pages/ComingSoon"));
const EmployeeForm = lazy(() => import("./pages/ComingSoon"));
const OnboardingQueue = lazy(() => import("./pages/ComingSoon"));
const OnboardingWizard = lazy(() => import("./pages/ComingSoon"));
const OnboardingDetail = lazy(() => import("./pages/ComingSoon"));
const EmployeePassport = lazy(() => import("./pages/ComingSoon"));
const PassportPrint = lazy(() => import("./pages/ComingSoon"));
const MovementCenter = lazy(() => import("./pages/ComingSoon"));
const MovementWizard = lazy(() => import("./pages/ComingSoon"));
const MovementDetail = lazy(() => import("./pages/ComingSoon"));
const ReportingStructure = lazy(() => import("./pages/ComingSoon"));
const DocumentsCenter = lazy(() => import("./pages/ComingSoon"));
const OrganizationIndex = lazy(() => import("./pages/ComingSoon"));
const OrgChart = lazy(() => import("./pages/ComingSoon"));
const CapacityDashboard = lazy(() => import("./pages/ComingSoon"));
const OpenPositions = lazy(() => import("./pages/ComingSoon"));
const SuccessionPage = lazy(() => import("./pages/ComingSoon"));
const WorkforcePlanning = lazy(() => import("./pages/ComingSoon"));
const PerformanceIndex = lazy(() => import("./pages/ComingSoon"));
const GoalsCenter = lazy(() => import("./pages/ComingSoon"));
const ReviewCenter = lazy(() => import("./pages/ComingSoon"));
const RecognitionCenter = lazy(() => import("./pages/ComingSoon"));
const PipCenter = lazy(() => import("./pages/ComingSoon"));
const CareerGrowth = lazy(() => import("./pages/ComingSoon"));
const PromotionReadinessPage = lazy(() => import("./pages/ComingSoon"));
const LearningIndex = lazy(() => import("./pages/ComingSoon"));
const CourseCatalog = lazy(() => import("./pages/ComingSoon"));
const LearningPathsPage = lazy(() => import("./pages/ComingSoon"));
const EnrollmentCenter = lazy(() => import("./pages/ComingSoon"));
const SkillsCenter = lazy(() => import("./pages/ComingSoon"));
const CertificationCenter = lazy(() => import("./pages/ComingSoon"));
const DepartmentSkillMatrix = lazy(() => import("./pages/ComingSoon"));
const CareerRoadmapsPage = lazy(() => import("./pages/ComingSoon"));
const RecruitmentIndex = lazy(() => import("./pages/admin-os/RecruitmentCenter"));
const HiringRequestCenter = lazy(() => import("./pages/ComingSoon"));
const CandidateDirectory = lazy(() => import("./pages/ComingSoon"));
const CandidateDetail = lazy(() => import("./pages/ComingSoon"));
const InterviewPipeline = lazy(() => import("./pages/ComingSoon"));
const OfferCenter = lazy(() => import("./pages/ComingSoon"));
const RecruitmentAnalytics = lazy(() => import("./pages/ComingSoon"));
const AttendanceIndex = lazy(() => import("./pages/ComingSoon"));
const MyAttendance = lazy(() => import("./pages/ComingSoon"));
const LeaveCenter = lazy(() => import("./pages/ComingSoon"));
const ShiftManagement = lazy(() => import("./pages/ComingSoon"));
const HolidayCalendar = lazy(() => import("./pages/ComingSoon"));
const AttendanceCorrections = lazy(() => import("./pages/ComingSoon"));
const WorkforceAvailability = lazy(() => import("./pages/ComingSoon"));
const PayrollIndex = lazy(() => import("./pages/ComingSoon"));
const PayrollCycles = lazy(() => import("./pages/ComingSoon"));
const PayrollCycleDetail = lazy(() => import("./pages/ComingSoon"));
const CompensationPlansPage = lazy(() => import("./pages/ComingSoon"));
const SalaryStructuresPage = lazy(() => import("./pages/ComingSoon"));
const SalaryRevisionsPage = lazy(() => import("./pages/ComingSoon"));
const BonusCenter = lazy(() => import("./pages/ComingSoon"));
const BenefitsCenter = lazy(() => import("./pages/ComingSoon"));
const ReimbursementCenter = lazy(() => import("./pages/ComingSoon"));
// Executive Workspace (Phase 3.1)
const ExecutiveGate = lazy(() => import("./pages/ComingSoon"));
const ExecutiveLayout = lazy(() => import("./pages/ComingSoon"));
const ExecutiveDashboard = lazy(() => import("./pages/ComingSoon"));
const ExecutiveProfile = lazy(() => import("./pages/ComingSoon"));
// Phase 3.9 — Founder Office Security & Identity
const SecurityShell = lazy(() => import("./pages/ComingSoon"));
const SecurityOverview = lazy(() => import("./pages/ComingSoon"));
const IdentityProfile = lazy(() => import("./pages/ComingSoon"));
const SessionManagerPage = lazy(() => import("./pages/ComingSoon"));
const TrustedDevicesPage = lazy(() => import("./pages/ComingSoon"));
const RecoveryCenterPage = lazy(() => import("./pages/ComingSoon"));
const PasswordAndMFAPage = lazy(() => import("./pages/ComingSoon"));
const SecurityAlertsPage = lazy(() => import("./pages/ComingSoon"));
const LoginHistoryPage = lazy(() => import("./pages/ComingSoon"));
const SecurityPoliciesPage = lazy(() => import("./pages/ComingSoon"));
const ExecutivePlaceholders = () => import("./pages/ComingSoon");
const ExecutiveInbox = lazy(() => import("./pages/ComingSoon"));
const ExecutiveApprovalDetail = lazy(() => import("./pages/ComingSoon"));

const ExecutiveDepartments = lazy(() => import("./pages/ComingSoon"));
const ExecutiveEmployees = lazy(() => import("./pages/ComingSoon"));
const ExecutiveReports = lazy(() => import("./pages/ComingSoon"));
const DecisionLogPage = lazy(() => import("./pages/ComingSoon"));
// Phase 3.8 — Company Configuration & Global Settings
const CompanyShell = lazy(() => import("./pages/ComingSoon"));
const CompanyOverview = lazy(() => import("./pages/ComingSoon"));
const CompanyProfilePage = lazy(() => import("./pages/ComingSoon"));
const BrandManagementPage = lazy(() => import("./pages/ComingSoon"));
const PlatformPreferencesPage = lazy(() => import("./pages/ComingSoon"));
const LocalizationCenterPage = lazy(() => import("./pages/ComingSoon"));
const FeatureFlagsManagerPage = lazy(() => import("./pages/ComingSoon"));
const ModuleManagerPage = lazy(() => import("./pages/ComingSoon"));
const CompanyCalendarPage = lazy(() => import("./pages/ComingSoon"));
const MetadataManagerPage = lazy(() => import("./pages/ComingSoon"));
// Phase 3.10 — Automation
const AutomationShell = lazy(() => import("./pages/ComingSoon"));
const AutomationOverview = lazy(() => import("./pages/ComingSoon"));
const AutomationsList = lazy(() => import("./pages/ComingSoon"));
const AutomationBuilder = lazy(() => import("./pages/ComingSoon"));
const AutomationSchedulesPage = lazy(() => import("./pages/ComingSoon"));
const AutomationRemindersPage = lazy(() => import("./pages/ComingSoon"));
const AutomationEscalationsPage = lazy(() => import("./pages/ComingSoon"));
const AutomationTemplatesPage = lazy(() => import("./pages/ComingSoon"));
const AutomationHistoryPage = lazy(() => import("./pages/ComingSoon"));
const AutomationMonitorPage = lazy(() => import("./pages/ComingSoon"));
// Phase 3.11 — Executive AI
const AiShell = lazy(() => import("./pages/ComingSoon"));
const AiChat = lazy(() => import("./pages/ComingSoon"));
const AiRecommendationsPage = lazy(() => import("./pages/ComingSoon"));
const AiPredictionsPage = lazy(() => import("./pages/ComingSoon"));
const AiRisksPage = lazy(() => import("./pages/ComingSoon"));
const AiSummariesPage = lazy(() => import("./pages/ComingSoon"));
const AiKnowledgePage = lazy(() => import("./pages/ComingSoon"));
const AiPromptsPage = lazy(() => import("./pages/ComingSoon"));
// Phase 3.12 — Production Readiness
const ProductionShell = lazy(() => import("./pages/ComingSoon"));
const ProductionOverview = lazy(() => import("./pages/ComingSoon"));
const ProductionModules = lazy(() => import("./pages/ComingSoon"));
const ProductionIntegrations = lazy(() => import("./pages/ComingSoon"));
const ProductionChecklist = lazy(() => import("./pages/ComingSoon"));
const ProductionReleases = lazy(() => import("./pages/ComingSoon"));
const ProductionHistory = lazy(() => import("./pages/ComingSoon"));
const ProductionIssues = lazy(() => import("./pages/ComingSoon"));
// Phase 3.11 — KIP (Knowledge Intelligence Platform)
const KipShell = lazy(() => import("./pages/ComingSoon"));
const KnowledgeHome = lazy(() => import("./pages/ComingSoon"));
const KipChatWorkspace = lazy(() => import("./pages/ComingSoon"));
const KipDocumentLibrary = lazy(() => import("./pages/ComingSoon"));
const KipCollectionsList = lazy(() => import("./pages/ComingSoon"));
const KipCollectionDetail = lazy(() => import("./pages/ComingSoon"));
const KipKnowledgeSearch = lazy(() => import("./pages/ComingSoon"));
const KipBookmarksPage = lazy(() => import("./pages/ComingSoon"));
const KipConversationHistory = lazy(() => import("./pages/ComingSoon"));
const ExecutiveNotificationsPage = lazy(() => import("./pages/ComingSoon"));
// Phase 3.4 — Governance
const GovernanceIndex = lazy(() => import("./pages/ComingSoon"));
const PolicyCenter = lazy(() => import("./pages/ComingSoon"));
const PolicyDetail = lazy(() => import("./pages/ComingSoon"));
const AuthorityMatrixPage = lazy(() => import("./pages/ComingSoon"));
const ApprovalMatrixPage = lazy(() => import("./pages/ComingSoon"));
const DelegationCenter = lazy(() => import("./pages/ComingSoon"));
const DepartmentCharters = lazy(() => import("./pages/ComingSoon"));
const GovernanceSearchPage = lazy(() => import("./pages/ComingSoon"));
// Phase 3.5 — Strategic Decisions
const DecisionCenter = lazy(() => import("./pages/ComingSoon"));
const DecisionEditor = lazy(() => import("./pages/ComingSoon"));
const DecisionDetail = lazy(() => import("./pages/ComingSoon"));
const DecisionSearchPage = lazy(() => import("./pages/ComingSoon"));

// Phase 3.6 — Executive Reports & Analytics
const ReportsShell = lazy(() => import("./pages/ComingSoon"));
const ReportsOverview = lazy(() => import("./pages/ComingSoon"));
const AnalyticsCenter = lazy(() => import("./pages/ComingSoon"));
const ScorecardsPage = lazy(() => import("./pages/ComingSoon"));
const TrendAnalysis = lazy(() => import("./pages/ComingSoon"));
const ReportLibrary = lazy(() => import("./pages/ComingSoon"));
const ScheduledReportsPage = lazy(() => import("./pages/ComingSoon"));
const ExportCenterPage = lazy(() => import("./pages/ComingSoon"));
const DepartmentReportCompliance = lazy(() => import("./pages/ComingSoon"));

// Phase 3.7 — Executive Command Center
const CommandShell = lazy(() => import("./pages/ComingSoon"));
const CommandOverview = lazy(() => import("./pages/ComingSoon"));
const EmergencyPanel = lazy(() => import("./pages/ComingSoon"));
const MaintenanceCenterPage = lazy(() => import("./pages/ComingSoon"));
const AnnouncementCenterPage = lazy(() => import("./pages/ComingSoon"));
const BroadcastCenterPage = lazy(() => import("./pages/ComingSoon"));
const SystemStatusDashboard = lazy(() => import("./pages/ComingSoon"));
const IncidentCenterPage = lazy(() => import("./pages/ComingSoon"));
const ContinuityCenterPage = lazy(() => import("./pages/ComingSoon"));
const LockdownPanelPage = lazy(() => import("./pages/ComingSoon"));
const WatchlistPanelPage = lazy(() => import("./pages/ComingSoon"));
const FounderOfficeDashboard = lazy(
  () => import("./pages/ComingSoon"));
// AppointmentsPanel handled in admin-os lazy imports above
const AuditCenter = lazy(() => import("./pages/ComingSoon"));
const DepartmentsIndex = lazy(
  () => import("./pages/ComingSoon"));
const DepartmentDetail = lazy(
  () => import("./pages/ComingSoon"));
// Phase 4.1 — Trust & Safety
const TrustSafetyShell = lazy(() => import("./pages/ComingSoon"));
const TsDashboard = lazy(() => import("./pages/ComingSoon"));
const TsCaseQueue = lazy(() => import("./pages/ComingSoon"));
const TsCaseDetail = lazy(() => import("./pages/ComingSoon"));
const TsAppealsCenter = lazy(() => import("./pages/ComingSoon"));
const TsPolicyReference = lazy(() => import("./pages/ComingSoon"));
// Phase 4.2 — Verification
const VerificationShell = lazy(() => import("./pages/ComingSoon"));
const VerificationDashboard = lazy(() => import("./pages/ComingSoon"));
const VerApplicationQueue = lazy(() => import("./pages/ComingSoon"));
const VerCaseWorkspace = lazy(() => import("./pages/ComingSoon"));
const VerBadgeManager = lazy(() => import("./pages/ComingSoon"));
const VerAffiliationManager = lazy(() => import("./pages/ComingSoon"));
const VerAppealsCenter = lazy(() => import("./pages/ComingSoon"));
const VerHistoryPage = lazy(() => import("./pages/ComingSoon"));
const VerVirtualWorldRequests = lazy(() => import("./pages/ComingSoon"));
// Phase 4.3 — Support
const SupportShell = lazy(() => import("./pages/ComingSoon"));
const SupportDashboardPage = lazy(() => import("./pages/ComingSoon"));
const SupportTicketQueue = lazy(() => import("./pages/ComingSoon"));
const SupportTicketWorkspace = lazy(() => import("./pages/ComingSoon"));
const SupportSlaDashboard = lazy(() => import("./pages/ComingSoon"));
const SupportAnalyticsPage = lazy(() => import("./pages/ComingSoon"));

const EngineeringShell = lazy(() => import("./pages/ComingSoon"));
const EngDashboard = lazy(() => import("./pages/ComingSoon"));
const EngProjectsPage = lazy(() => import("./pages/ComingSoon"));
const EngSprintsPage = lazy(() => import("./pages/ComingSoon"));
const EngKanbanBoard = lazy(() => import("./pages/ComingSoon"));
const EngTaskCenter = lazy(() => import("./pages/ComingSoon"));
const EngBugCenter = lazy(() => import("./pages/ComingSoon"));
const EngReleaseCenter = lazy(() => import("./pages/ComingSoon"));
const EngDesignCenter = lazy(() => import("./pages/ComingSoon"));
const EngDocumentationCenter = lazy(() => import("./pages/ComingSoon"));
const EngReports = lazy(() => import("./pages/ComingSoon"));

const FinanceLegalShell = lazy(() => import("./pages/ComingSoon"));
const FinanceDashboard = lazy(() => import("./pages/ComingSoon"));
const FinBudgetCenter = lazy(() => import("./pages/ComingSoon"));
const FinExpenseCenter = lazy(() => import("./pages/ComingSoon"));
const FinInvoiceCenter = lazy(() => import("./pages/ComingSoon"));
const FinProcurementCenter = lazy(() => import("./pages/ComingSoon"));
const FinVendorCenter = lazy(() => import("./pages/ComingSoon"));
const FinContractCenter = lazy(() => import("./pages/ComingSoon"));
const FinComplianceDashboard = lazy(() => import("./pages/ComingSoon"));
const FinCreatorPayoutQueue = lazy(() => import("./pages/ComingSoon"));
const FinHireApprovals = lazy(() => import("./pages/ComingSoon"));
const FinNewHireBankDetails = lazy(() => import("./pages/ComingSoon"));
const FinWalletLookup = lazy(() => import("./pages/ComingSoon"));
const HireCompensationPage = lazy(() => import("./pages/ComingSoon"));
const EmployeeFinanceOnboarding = lazy(() => import("./pages/ComingSoon"));
const SecurityDeptShell = lazy(() => import("./pages/ComingSoon"));
const SecurityDashboardPage = lazy(() => import("./pages/ComingSoon"));
const SecIncidentCenter = lazy(() => import("./pages/ComingSoon"));
const SecIncidentWorkspace = lazy(() => import("./pages/ComingSoon"));
const SecThreatCenter = lazy(() => import("./pages/ComingSoon"));
const SecIamCenter = lazy(() => import("./pages/ComingSoon"));
const SecAccessReviews = lazy(() => import("./pages/ComingSoon"));
const SecInvestigationWorkspace = lazy(() => import("./pages/ComingSoon"));
const SecComplianceDashboard = lazy(() => import("./pages/ComingSoon"));
const SecAnalytics = lazy(() => import("./pages/ComingSoon"));
const PlatformIndex = lazy(() => import("./pages/ComingSoon"));
const ApprovalCenter = lazy(() => import("./pages/ComingSoon"));
const WorkflowViewer = lazy(() => import("./pages/ComingSoon"));
const NotificationCenter = lazy(() => import("./pages/ComingSoon"));
const ActivityFeed = lazy(() => import("./pages/ComingSoon"));
const AssignmentQueue = lazy(() => import("./pages/ComingSoon"));
const GlobalSearch = lazy(() => import("./pages/ComingSoon"));
const DocumentManager = lazy(() => import("./pages/ComingSoon"));
const ReportsCenter = lazy(() => import("./pages/ComingSoon"));
const DashboardConsole = lazy(() => import("./pages/ComingSoon"));
const SchedulerConsole = lazy(() => import("./pages/ComingSoon"));
const DesignSystem = lazy(() => import("./pages/ComingSoon"));



const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Organization workspace (lazy)
const OrganizationLayout = lazy(() => import("./pages/ComingSoon"));
const OrgCreateOrganization = lazy(() => import("./pages/ComingSoon"));
const OrgDashboard = lazy(() => import("./pages/ComingSoon"));
const OrgFeed = lazy(() => import("./pages/ComingSoon"));
const OrgMembers = lazy(() => import("./pages/ComingSoon"));
const OrgMemberDetails = lazy(() => import("./pages/ComingSoon"));
const OrgRoles = lazy(() => import("./pages/ComingSoon"));
const OrgPermissions = lazy(() => import("./pages/ComingSoon"));
const OrgDepartments = lazy(() => import("./pages/ComingSoon"));
const OrgProjects = lazy(() => import("./pages/ComingSoon"));
const OrgTasks = lazy(() => import("./pages/ComingSoon"));
const OrgCalendar = lazy(() => import("./pages/ComingSoon"));
const OrgDrive = lazy(() => import("./pages/ComingSoon"));
const OrgHiring = lazy(() => import("./pages/ComingSoon"));
const OrgAnalytics = lazy(() => import("./pages/ComingSoon"));
const OrgSettings = lazy(() => import("./pages/ComingSoon"));
const OrgProfile = lazy(() => import("./pages/ComingSoon"));
const OrgAnnouncements = lazy(() => import("./pages/ComingSoon"));
const OrgSearch = lazy(() => import("./pages/ComingSoon"));
const OrgNotifications = lazy(() => import("./pages/ComingSoon"));

const RouteFallback = () => <AppLoadingScreen />;

const NativeInit = () => {
  useNativeApp();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NativeInit />
          <CallProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/certificate/:postId" element={<Certificate />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/profile-creation" element={<ProfileCreation />} />
                
                <Route element={<AppShell />}>
                  <Route path="/" element={<Feed />} />

                  <Route path="/reels" element={<Reels />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/messages" element={<MessagesPasscodeGate><Messages /></MessagesPasscodeGate>} />
                  <Route path="/messages/:id" element={<MessagesPasscodeGate><Conversation /></MessagesPasscodeGate>} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/invite/:token" element={<InviteAccept />} />
                  <Route path="/collab/:postId" element={<CollabInviteAccept />} />
                  <Route path="/compose" element={<Compose />} />
                  <Route path="/compose/reel" element={<ReelCompose />} />
                  <Route path="/compose/story" element={<StoryCompose />} />
                  <Route path="/creator/terms" element={<CreatorTerms />} />
                  <Route path="/p/:postId" element={<PostDetail />} />
                  <Route path="/tag/:tag" element={<Tag />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/wallet/legacy" element={<Wallet />} />
                  <Route path="/wallet/analytics" element={<WalletAnalytics />} />
                  <Route path="/wallet/transactions" element={<WalletTransactions />} />
                  <Route path="/wallet/passport" element={<WalletPassport />} />
                  <Route path="/wallet/coins" element={<WalletCoins />} />
                  <Route path="/wallet/gift" element={<WalletGift />} />
                  <Route path="/wallet/withdraw" element={<WalletWithdraw />} />
                  <Route path="/wallet/qr" element={<WalletQR />} />
                  <Route path="/wallet/security" element={<WalletSecurity />} />
                  <Route path="/wallet/card" element={<WalletCardPage />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/edit" element={<EditProfile />} />
                  <Route path="/u/:username" element={<Profile />} />
                  <Route path="/u/:username/:kind" element={<FollowList />} />
                  <Route path="/premium" element={<Premium />} />
                  <Route path="/store" element={<Store />} />
                  <Route path="/checkout/return" element={<CheckoutReturn />} />
                  <Route path="/verification" element={<Verification />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/help" element={<Navigate to="/support" replace />} />
                  <Route path="/assistant" element={<Assistant />} />
                  <Route path="/drafts" element={<Drafts />} />
                  <Route path="/p/:postId/insights" element={<PostInsights />} />
                  <Route path="/close-friends" element={<CloseFriends />} />
                  <Route path="/founders" element={<Navigate to="/hall-of-founders" replace />} />
                  <Route path="/hall-of-founders" element={<HallOfFoundersScreen />} />
                  <Route path="/founder-council" element={<FounderCouncilScreen />} />
                  <Route path="/founders/:username" element={<FounderChronicle />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/security" element={<TwoFactorSetup />} />
                  <Route path="/settings/activity" element={<LoginActivityScreen />} />
                  <Route path="/settings/privacy" element={<PrivacyScreen />} />
                  <Route path="/settings/blocked" element={<BlockedListScreen />} />
                  <Route path="/settings/export" element={<DataExportScreen />} />
                  <Route path="/settings/delete" element={<DeleteAccountScreen />} />
                  <Route path="/settings/password" element={<ChangePasswordScreen />} />
                  <Route path="/settings/email" element={<ChangeEmailScreen />} />
                  <Route path="/settings/phone" element={<ChangePhoneScreen />} />
                  <Route path="/creator-hub" element={<CreatorHub />} />
                  <Route path="/creator/studio" element={<CreatorStudio />} />
                  <Route path="/news" element={<CreatorNews />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/aura-level" element={<AuraLevel />} />
                  <Route path="/monetization" element={<Monetization />} />
                  <Route path="/verification-center" element={<VerificationCenter />} />
                  <Route path="/virtual-world" element={<VirtualWorld />} />
                  <Route path="/live" element={<LiveList />} />
                  <Route path="/live/host" element={<LiveHost />} />
                  <Route path="/live/:id" element={<LiveViewer />} />
                  <Route path="/organization/create" element={<OrgCreateOrganization />} />
                  {/* Slug-based routing (Phase 1). Legacy /organization/* still works below. */}
                  <Route path="/organization/:slug" element={<OrganizationLayout />}>
                    <Route index element={<OrgDashboard />} />
                    <Route path="dashboard" element={<OrgDashboard />} />
                    <Route path="feed" element={<OrgFeed />} />
                    <Route path="members" element={<OrgMembers />} />
                    <Route path="members/:memberId" element={<OrgMemberDetails />} />
                    <Route path="roles" element={<OrgRoles />} />
                    <Route path="permissions" element={<OrgPermissions />} />
                    <Route path="departments" element={<OrgDepartments />} />
                    <Route path="projects" element={<OrgProjects />} />
                    <Route path="tasks" element={<OrgTasks />} />
                    <Route path="calendar" element={<OrgCalendar />} />
                    <Route path="drive" element={<OrgDrive />} />
                    <Route path="hiring" element={<OrgHiring />} />
                    <Route path="analytics" element={<OrgAnalytics />} />
                    <Route path="settings" element={<OrgSettings />} />
                    <Route path="profile" element={<OrgProfile />} />
                    <Route path="announcements" element={<OrgAnnouncements />} />
                    <Route path="search" element={<OrgSearch />} />
                    <Route path="notifications" element={<OrgNotifications />} />
                  </Route>
                  {/* Legacy no-slug routes — Provider resolves to the user's first workspace. */}
                  <Route path="/organization" element={<OrganizationLayout />}>
                    <Route index element={<OrgDashboard />} />
                    <Route path="dashboard" element={<OrgDashboard />} />
                    <Route path="feed" element={<OrgFeed />} />
                    <Route path="members" element={<OrgMembers />} />
                    <Route path="members/:memberId" element={<OrgMemberDetails />} />
                    <Route path="roles" element={<OrgRoles />} />
                    <Route path="permissions" element={<OrgPermissions />} />
                    <Route path="departments" element={<OrgDepartments />} />
                    <Route path="projects" element={<OrgProjects />} />
                    <Route path="tasks" element={<OrgTasks />} />
                    <Route path="calendar" element={<OrgCalendar />} />
                    <Route path="drive" element={<OrgDrive />} />
                    <Route path="hiring" element={<OrgHiring />} />
                    <Route path="analytics" element={<OrgAnalytics />} />
                    <Route path="settings" element={<OrgSettings />} />
                    <Route path="profile" element={<OrgProfile />} />
                    <Route path="announcements" element={<OrgAnnouncements />} />
                    <Route path="search" element={<OrgSearch />} />
                    <Route path="notifications" element={<OrgNotifications />} />
                  </Route>
                </Route>
              </Route>

              {/* Aurelix Ads Manager */}
              <Route element={<ProtectedRoute />}>
                <Route path="/ads" element={<AdsBusinessCenter />} />
                <Route path="/ads/review" element={<AdsReviewQueue />} />
                <Route path="/ads/finance" element={<AdsFinanceConsole />} />
                <Route path="/ads/:accountId" element={<AdsLayout />}>
                  <Route index element={<AdsDashboard />} />
                  <Route path="campaigns" element={<AdsManager />} />
                  <Route path="create" element={<AdsCampaignWizard />} />
                  <Route path="creatives" element={<AdsCreatives />} />
                  <Route path="billing" element={<AdsBilling />} />
                </Route>
              </Route>


              {/* Legacy /admin removed — redirect to new Admin OS */}
              <Route path="/admin" element={<Navigate to="/admin-os" replace />} />
              <Route path="/admin/*" element={<Navigate to="/admin-os" replace />} />

              {/* Aurelix Admin OS — internal enterprise workspace */}
              <Route element={<AdminOSGate />}>
                <Route path="/admin-os" element={<AdminOSDashboard />} />
                <Route path="/admin-os/verification" element={<AdminOSVerificationQueue />} />
                <Route path="/admin-os/appointments" element={<AppointmentsPanel />} />
                <Route path="/admin-os/approvals" element={<ApprovalsInbox />} />
                <Route path="/admin-os/recruitment" element={<RecruitmentIndex />} />
                <Route path="/admin-os/finance" element={<FinanceDepartment />} />
              </Route>

              <Route path="/admin-os/no-access" element={<AdminOSNoAccess />} />

              {/* Founder Office Executive Workspace (Phase 3.1) */}
              <Route element={<ExecutiveGate />}>
                <Route path="/admin-os/executive" element={<ExecutiveLayout />}>
                  <Route index element={<ExecutiveDashboard />} />
                  <Route path="inbox" element={<ExecutiveInbox />} />
                  <Route path="inbox/:id" element={<ExecutiveApprovalDetail />} />
                  <Route path="approvals" element={<ExecutiveInbox />} />
                  <Route path="approvals/:id" element={<ExecutiveApprovalDetail />} />
                  <Route path="departments" element={<ExecutiveDepartments />} />
                  <Route path="employees" element={<ExecutiveEmployees />} />
                  <Route path="reports" element={<ReportsShell />}>
                    <Route index element={<ReportsOverview />} />
                    <Route path="analytics" element={<AnalyticsCenter />} />
                    <Route path="scorecards" element={<ScorecardsPage />} />
                    <Route path="trends" element={<TrendAnalysis />} />
                    <Route path="library" element={<ReportLibrary />} />
                    <Route path="scheduled" element={<ScheduledReportsPage />} />
                    <Route path="exports" element={<ExportCenterPage />} />
                    <Route path="compliance" element={<DepartmentReportCompliance />} />
                  </Route>
                  <Route path="decisions" element={<DecisionCenter />} />
                  <Route path="decisions/new" element={<DecisionEditor />} />
                  <Route path="decisions/search" element={<DecisionSearchPage />} />
                  <Route path="decisions/approvals-log" element={<DecisionLogPage />} />
                  <Route path="decisions/:id" element={<DecisionDetail />} />
                  <Route path="governance" element={<GovernanceIndex />} />
                  <Route path="governance/policies" element={<PolicyCenter />} />
                  <Route path="governance/policies/:id" element={<PolicyDetail />} />
                  <Route path="governance/authority" element={<AuthorityMatrixPage />} />
                  <Route path="governance/approval-matrix" element={<ApprovalMatrixPage />} />
                  <Route path="governance/delegations" element={<DelegationCenter />} />
                  <Route path="governance/charters" element={<DepartmentCharters />} />
                  <Route path="governance/search" element={<GovernanceSearchPage />} />
                  <Route path="command" element={<CommandShell />}>
                    <Route index element={<CommandOverview />} />
                    <Route path="emergency" element={<EmergencyPanel />} />
                    <Route path="maintenance" element={<MaintenanceCenterPage />} />
                    <Route path="announcements" element={<AnnouncementCenterPage />} />
                    <Route path="broadcasts" element={<BroadcastCenterPage />} />
                    <Route path="status" element={<SystemStatusDashboard />} />
                    <Route path="incidents" element={<IncidentCenterPage />} />
                    <Route path="continuity" element={<ContinuityCenterPage />} />
                    <Route path="lockdowns" element={<LockdownPanelPage />} />
                    <Route path="watchlists" element={<WatchlistPanelPage />} />
                  </Route>
                  <Route path="security" element={<SecurityShell />}>
                    <Route index element={<SecurityOverview />} />
                    <Route path="identity" element={<IdentityProfile />} />
                    <Route path="sessions" element={<SessionManagerPage />} />
                    <Route path="devices" element={<TrustedDevicesPage />} />
                    <Route path="recovery" element={<RecoveryCenterPage />} />
                    <Route path="password" element={<PasswordAndMFAPage />} />
                    <Route path="alerts" element={<SecurityAlertsPage />} />
                    <Route path="history" element={<LoginHistoryPage />} />
                    <Route path="policies" element={<SecurityPoliciesPage />} />
                  </Route>
                  <Route path="company" element={<CompanyShell />}>
                    <Route index element={<CompanyOverview />} />
                    <Route path="profile" element={<CompanyProfilePage />} />
                    <Route path="brand" element={<BrandManagementPage />} />
                    <Route path="preferences" element={<PlatformPreferencesPage />} />
                    <Route path="localization" element={<LocalizationCenterPage />} />
                    <Route path="features" element={<FeatureFlagsManagerPage />} />
                    <Route path="modules" element={<ModuleManagerPage />} />
                    <Route path="calendar" element={<CompanyCalendarPage />} />
                    <Route path="metadata" element={<MetadataManagerPage />} />
                  </Route>
                  <Route path="automation" element={<AutomationShell />}>
                    <Route index element={<AutomationOverview />} />
                    <Route path="automations" element={<AutomationsList />} />
                    <Route path="builder" element={<AutomationBuilder />} />
                    <Route path="builder/:id" element={<AutomationBuilder />} />
                    <Route path="schedules" element={<AutomationSchedulesPage />} />
                    <Route path="reminders" element={<AutomationRemindersPage />} />
                    <Route path="escalations" element={<AutomationEscalationsPage />} />
                    <Route path="templates" element={<AutomationTemplatesPage />} />
                    <Route path="history" element={<AutomationHistoryPage />} />
                    <Route path="monitor" element={<AutomationMonitorPage />} />
                  </Route>
                  <Route path="knowledge" element={<KipShell />}>
                    <Route index element={<KnowledgeHome />} />
                    <Route path="chat" element={<KipChatWorkspace />} />
                    <Route path="library" element={<KipDocumentLibrary />} />
                    <Route path="collections" element={<KipCollectionsList />} />
                    <Route path="collections/:id" element={<KipCollectionDetail />} />
                    <Route path="search" element={<KipKnowledgeSearch />} />
                    <Route path="bookmarks" element={<KipBookmarksPage />} />
                    <Route path="history" element={<KipConversationHistory />} />
                  </Route>
                  <Route path="ai" element={<AiShell />}>
                    <Route index element={<AiChat />} />
                    <Route path="recommendations" element={<AiRecommendationsPage />} />
                    <Route path="predictions" element={<AiPredictionsPage />} />
                    <Route path="risks" element={<AiRisksPage />} />
                    <Route path="summaries" element={<AiSummariesPage />} />
                    <Route path="knowledge" element={<AiKnowledgePage />} />
                    <Route path="prompts" element={<AiPromptsPage />} />
                  </Route>
                  <Route path="production" element={<ProductionShell />}>
                    <Route index element={<ProductionOverview />} />
                    <Route path="modules" element={<ProductionModules />} />
                    <Route path="integrations" element={<ProductionIntegrations />} />
                    <Route path="checklist" element={<ProductionChecklist />} />
                    <Route path="releases" element={<ProductionReleases />} />
                    <Route path="history" element={<ProductionHistory />} />
                    <Route path="issues" element={<ProductionIssues />} />
                  </Route>
                  <Route path="profile" element={<ExecutiveProfile />} />
                  <Route path="notifications" element={<ExecutiveNotificationsPage />} />
                </Route>
              </Route>

              <Route element={<AdminOSGate />}>
                <Route path="/admin-os/first-login" element={<AdminOSFirstLogin />} />
                <Route path="/admin-os" element={<AdminOSLayout />}>
                  <Route index element={<AdminOSDashboard />} />
                  <Route path="routing" element={<RoutingOverview />} />
                  <Route path="approvals" element={<ApprovalsInbox />} />
                  <Route path="people-ops" element={<PeopleOpsIndex />} />
                  <Route
                    path="people-ops/new"
                    element={<NotFound />}
                  />
                  <Route path="people-ops/:id" element={<EmployeeDetailPage />} />
                  <Route
                    path="people-ops/:id/edit"
                    element={<NotFound />}
                  />
                  <Route path="people-ops/onboarding" element={<OnboardingQueue />} />
                  <Route path="people-ops/onboarding/new" element={<OnboardingWizard />} />
                  <Route path="people-ops/onboarding/:employeeId" element={<OnboardingDetail />} />
                  <Route path="people-ops/:employeeId/passport" element={<EmployeePassport />} />
                  <Route path="people-ops/:employeeId/passport/print" element={<PassportPrint />} />
                  <Route path="people-ops/movements" element={<MovementCenter />} />
                  <Route path="people-ops/movements/new" element={<MovementWizard />} />
                  <Route path="people-ops/movements/:id" element={<MovementDetail />} />
                  <Route path="people-ops/reporting" element={<ReportingStructure />} />
                  <Route path="people-ops/documents" element={<DocumentsCenter />} />
                  <Route path="people-ops/org" element={<OrganizationIndex />} />
                  <Route path="people-ops/org/chart" element={<OrgChart />} />
                  <Route path="people-ops/org/capacity" element={<CapacityDashboard />} />
                  <Route path="people-ops/org/positions" element={<OpenPositions />} />
                  <Route path="people-ops/org/succession" element={<SuccessionPage />} />
                  <Route path="people-ops/org/planning" element={<WorkforcePlanning />} />
                  <Route path="people-ops/performance" element={<PerformanceIndex />} />
                  <Route path="people-ops/performance/goals" element={<GoalsCenter />} />
                  <Route path="people-ops/performance/reviews" element={<ReviewCenter />} />
                  <Route path="people-ops/performance/recognition" element={<RecognitionCenter />} />
                  <Route path="people-ops/performance/pip" element={<PipCenter />} />
                  <Route path="people-ops/performance/career" element={<CareerGrowth />} />
                  <Route path="people-ops/performance/promotion" element={<PromotionReadinessPage />} />
                  <Route path="people-ops/learning" element={<LearningIndex />} />
                  <Route path="people-ops/learning/catalog" element={<CourseCatalog />} />
                  <Route path="people-ops/learning/paths" element={<LearningPathsPage />} />
                  <Route path="people-ops/learning/enrollments" element={<EnrollmentCenter />} />
                  <Route path="people-ops/learning/skills" element={<SkillsCenter />} />
                  <Route path="people-ops/learning/certifications" element={<CertificationCenter />} />
                  <Route path="people-ops/learning/matrix" element={<DepartmentSkillMatrix />} />
                  <Route path="people-ops/learning/roadmaps" element={<CareerRoadmapsPage />} />
                  <Route path="people-ops/recruitment" element={<RecruitmentIndex />} />
                  <Route path="people-ops/recruitment/requests" element={<HiringRequestCenter />} />
                  <Route path="people-ops/recruitment/candidates" element={<CandidateDirectory />} />
                  <Route path="people-ops/recruitment/candidates/:id" element={<CandidateDetail />} />
                  <Route path="people-ops/recruitment/pipeline" element={<InterviewPipeline />} />
                  <Route path="people-ops/recruitment/applications/:applicationId" element={<InterviewPipeline />} />
                  <Route path="people-ops/recruitment/offers" element={<OfferCenter />} />
                  <Route path="people-ops/recruitment/analytics" element={<RecruitmentAnalytics />} />
                  <Route path="people-ops/recruitment/hire-compensation" element={<HireCompensationPage />} />
                  <Route path="employee/finance-onboarding" element={<EmployeeFinanceOnboarding />} />
                  <Route path="people-ops/attendance" element={<AttendanceIndex />} />
                  <Route path="people-ops/attendance/my" element={<MyAttendance />} />
                  <Route path="people-ops/attendance/leave" element={<LeaveCenter />} />
                  <Route path="people-ops/attendance/shifts" element={<ShiftManagement />} />
                  <Route path="people-ops/attendance/holidays" element={<HolidayCalendar />} />
                  <Route path="people-ops/attendance/corrections" element={<AttendanceCorrections />} />
                  <Route path="people-ops/attendance/availability" element={<WorkforceAvailability />} />
                  <Route path="people-ops/payroll" element={<PayrollIndex />} />
                  <Route path="people-ops/payroll/cycles" element={<PayrollCycles />} />
                  <Route path="people-ops/payroll/cycles/:id" element={<PayrollCycleDetail />} />
                  <Route path="people-ops/payroll/plans" element={<CompensationPlansPage />} />
                  <Route path="people-ops/payroll/salaries" element={<SalaryStructuresPage />} />
                  <Route path="people-ops/payroll/revisions" element={<SalaryRevisionsPage />} />
                  <Route path="people-ops/payroll/bonuses" element={<BonusCenter />} />
                  <Route path="people-ops/payroll/benefits" element={<BenefitsCenter />} />
                  <Route path="people-ops/payroll/reimbursements" element={<ReimbursementCenter />} />
                  <Route
                    path="founder-office"
                    element={<FounderOfficeDashboard />}
                  />
                  <Route
                    path="founder-office/appointments"
                    element={<AppointmentsPanel />}
                  />
                  <Route path="audit" element={<AuditCenter />} />
                  <Route path="departments" element={<DepartmentsIndex />} />
                  <Route path="departments/:id" element={<DepartmentDetail />} />
                  <Route path="departments/:id" element={<DepartmentDetail />} />
                  <Route path="trust-safety" element={<TrustSafetyShell />}>
                    <Route index element={<TsDashboard />} />
                    <Route path="queue" element={<TsCaseQueue />} />
                    <Route path="cases/:id" element={<TsCaseDetail />} />
                    <Route path="appeals" element={<TsAppealsCenter />} />
                    <Route path="policies" element={<TsPolicyReference />} />
                  </Route>
                  <Route path="verification" element={<VerificationShell />}>
                    <Route index element={<VerificationDashboard />} />
                    <Route path="queue" element={<VerApplicationQueue />} />
                    <Route path="applications/:id" element={<VerCaseWorkspace />} />
                    <Route path="badges" element={<VerBadgeManager />} />
                    <Route path="affiliations" element={<VerAffiliationManager />} />
                    <Route path="appeals" element={<VerAppealsCenter />} />
                    <Route path="history" element={<VerHistoryPage />} />
                    <Route path="virtual-world" element={<VerVirtualWorldRequests />} />
                    <Route path="content-review" element={<ContentClassificationQueue />} />
                    <Route path="content-review/:id" element={<ReviewerWorkspace />} />
                  </Route>
                  <Route path="engineering" element={<EngineeringShell />}>
                    <Route index element={<EngDashboard />} />
                    <Route path="projects" element={<EngProjectsPage />} />
                    <Route path="sprints" element={<EngSprintsPage />} />
                    <Route path="board" element={<EngKanbanBoard />} />
                    <Route path="tasks" element={<EngTaskCenter />} />
                    <Route path="bugs" element={<EngBugCenter />} />
                    <Route path="releases" element={<EngReleaseCenter />} />
                    <Route path="design" element={<EngDesignCenter />} />
                    <Route path="docs" element={<EngDocumentationCenter />} />
                    <Route path="reports" element={<EngReports />} />
                  </Route>
                  <Route path="support" element={<SupportShell />}>
                    <Route index element={<SupportDashboardPage />} />
                    <Route path="queue" element={<SupportTicketQueue />} />
                    <Route path="tickets/:id" element={<SupportTicketWorkspace />} />
                    <Route path="sla" element={<SupportSlaDashboard />} />
                    <Route path="analytics" element={<SupportAnalyticsPage />} />
                  </Route>
                  <Route path="finance-legal" element={<FinanceLegalShell />}>
                    <Route index element={<FinPaymentOperations />} />
                    <Route path="dashboard" element={<FinanceDashboard />} />
                    <Route path="budgets" element={<FinBudgetCenter />} />
                    <Route path="expenses" element={<FinExpenseCenter />} />
                    <Route path="invoices" element={<FinInvoiceCenter />} />
                    <Route path="payment-operations" element={<Navigate to="/admin-os/finance-legal" replace />} />
                    <Route path="procurement" element={<FinProcurementCenter />} />
                    <Route path="vendors" element={<FinVendorCenter />} />
                    <Route path="contracts" element={<FinContractCenter />} />
                    <Route path="compliance" element={<FinComplianceDashboard />} />
                    <Route path="creator-payouts" element={<FinCreatorPayoutQueue />} />
                    <Route path="hire-approvals" element={<FinHireApprovals />} />
                    <Route path="new-hire-bank" element={<FinNewHireBankDetails />} />
                    <Route path="wallet-lookup" element={<FinWalletLookup />} />
                  </Route>
                  <Route path="security" element={<SecurityDeptShell />}>
                    <Route index element={<SecurityDashboardPage />} />
                    <Route path="incidents" element={<SecIncidentCenter />} />
                    <Route path="incidents/:id" element={<SecIncidentWorkspace />} />
                    <Route path="threats" element={<SecThreatCenter />} />
                    <Route path="iam" element={<SecIamCenter />} />
                    <Route path="access-reviews" element={<SecAccessReviews />} />
                    <Route path="investigations" element={<SecInvestigationWorkspace />} />
                    <Route path="compliance" element={<SecComplianceDashboard />} />
                    <Route path="analytics" element={<SecAnalytics />} />
                  </Route>
                  <Route path="platform" element={<PlatformIndex />} />
                  <Route path="platform/approvals" element={<ApprovalCenter />} />
                  <Route path="platform/workflows" element={<WorkflowViewer />} />
                  <Route path="platform/notifications" element={<NotificationCenter />} />
                  <Route path="platform/activity" element={<ActivityFeed />} />
                  <Route path="platform/assignments" element={<AssignmentQueue />} />
                  <Route path="platform/search" element={<GlobalSearch />} />
                  <Route path="platform/documents" element={<DocumentManager />} />
                  <Route path="platform/reports" element={<ReportsCenter />} />
                  <Route path="platform/dashboards" element={<DashboardConsole />} />
                  <Route path="platform/scheduler" element={<SchedulerConsole />} />
                  <Route path="platform/design-system" element={<DesignSystem />} />
                  <Route path=":slug" element={<AdminOSModulePlaceholder />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </CallProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);


export default App;
