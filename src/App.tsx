import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PublicLayout, AppLayout, AuthCenteredLayout } from './components/layout';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { ElevatedRoute } from './guards/ElevatedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Spinner } from './components/ui';

// Public pages (loaded eagerly for mobile data efficiency)
import Register from './pages/public/Register';
import RegisterDone from './pages/public/RegisterDone';
import Feedback from './pages/public/Feedback';
import FeedbackDone from './pages/public/FeedbackDone';
import NotFound from './pages/public/NotFound';

// Auth pages
const Login = lazy(() => import('./pages/auth/Login'));
const AdminSetup = lazy(() => import('./pages/auth/AdminSetup'));
const InviteVerify = lazy(() => import('./pages/auth/InviteVerify'));
const SetPassword = lazy(() => import('./pages/auth/SetPassword'));
const TotpSetup = lazy(() => import('./pages/auth/TotpSetup'));
const MfaVerify = lazy(() => import('./pages/auth/MfaVerify'));
const AcceptDesignation = lazy(() => import('./pages/auth/AcceptDesignation'));
const AcceptTransfer = lazy(() => import('./pages/auth/AcceptTransfer'));

// App / Dashboard pages
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const EventList = lazy(() => import('./pages/dashboard/EventList'));
const EventNew = lazy(() => import('./pages/dashboard/EventNew'));
const EventEdit = lazy(() => import('./pages/dashboard/EventEdit'));
const EventDetail = lazy(() => import('./pages/dashboard/EventDetail'));
const StaffDirectory = lazy(() => import('./pages/dashboard/StaffDirectory'));
const StaffLogs = lazy(() => import('./pages/dashboard/StaffLogs'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));

function LazyLoader({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-20 min-h-[50vh]">
          <Spinner className="h-8 w-8 text-teal" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Layout Routes (max-w-form, sticky translucent header, simple footer) */}
            <Route element={<PublicLayout />}>
              <Route path="/register/:eventSlug" element={<Register />} />
              <Route path="/register/:eventSlug/done" element={<RegisterDone />} />
              <Route path="/feedback/:eventSlug" element={<Feedback />} />
              <Route path="/feedback/:eventSlug/done" element={<FeedbackDone />} />
            </Route>

            {/* Auth Centered Layout Routes (no sidebar, centered card) */}
            <Route element={<AuthCenteredLayout />}>
              <Route
                path="/login"
                element={
                  <LazyLoader>
                    <Login />
                  </LazyLoader>
                }
              />
              <Route
                path="/system-setup"
                element={
                  <LazyLoader>
                    <AdminSetup />
                  </LazyLoader>
                }
              />
              <Route
                path="/invite/:token"
                element={
                  <LazyLoader>
                    <InviteVerify />
                  </LazyLoader>
                }
              />
              <Route
                path="/invite/:token/password"
                element={
                  <LazyLoader>
                    <SetPassword />
                  </LazyLoader>
                }
              />
              <Route
                path="/mfa/setup"
                element={
                  <LazyLoader>
                    <TotpSetup />
                  </LazyLoader>
                }
              />
              <Route
                path="/mfa/verify"
                element={
                  <LazyLoader>
                    <MfaVerify />
                  </LazyLoader>
                }
              />
              <Route
                path="/designation/accept/:token"
                element={
                  <LazyLoader>
                    <AcceptDesignation />
                  </LazyLoader>
                }
              />
              <Route
                path="/transfer/accept/:token"
                element={
                  <LazyLoader>
                    <AcceptTransfer />
                  </LazyLoader>
                }
              />
            </Route>

            {/* Protected App Routes (Sidebar Layout) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                {/* Available to All Roles (Admin, Backup Admin, Staff) */}
                <Route
                  path="/dashboard"
                  element={
                    <LazyLoader>
                      <Dashboard />
                    </LazyLoader>
                  }
                />
                <Route
                  path="/events"
                  element={
                    <LazyLoader>
                      <EventList />
                    </LazyLoader>
                  }
                />
                <Route
                  path="/events/new"
                  element={
                    <LazyLoader>
                      <EventNew />
                    </LazyLoader>
                  }
                />
                <Route
                  path="/events/:id"
                  element={
                    <LazyLoader>
                      <EventDetail />
                    </LazyLoader>
                  }
                />
                <Route
                  path="/events/:id/edit"
                  element={
                    <LazyLoader>
                      <EventEdit />
                    </LazyLoader>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <LazyLoader>
                      <Settings />
                    </LazyLoader>
                  }
                />

                {/* Elevated Routes: Admin + Backup Admin only */}
                <Route element={<ElevatedRoute />}>
                  <Route
                    path="/staff"
                    element={
                      <LazyLoader>
                        <StaffDirectory />
                      </LazyLoader>
                    }
                  />
                  <Route
                    path="/logs"
                    element={
                      <LazyLoader>
                        <StaffLogs />
                      </LazyLoader>
                    }
                  />
                </Route>
              </Route>
            </Route>

            {/* Redirects & Aliases for smooth migration from old paths */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin/events" element={<Navigate to="/events" replace />} />
            <Route path="/admin/events/new" element={<Navigate to="/events/new" replace />} />
            <Route path="/admin/events/:id" element={<Navigate to="/events/:id" replace />} />

            {/* 404 Catch-All */}
            <Route element={<PublicLayout />}>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
