import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { SocketProvider } from './contexts/SocketContext';

// Layout
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/auth/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { OTP } from './pages/auth/OTP';
import { QuickAccess } from './pages/auth/QuickAccess';
import { HelpCenter } from './pages/system/HelpCenter';

// Victim Pages
import { VictimDashboard } from './pages/victim/VictimDashboard';
import { SOSEmergencyPanel } from './pages/victim/SOSEmergencyPanel';
import { ResourceRequestForm } from './pages/victim/ResourceRequestForm';
import { MedicalEmergencyForm } from './pages/victim/MedicalEmergencyForm';
import { LocationSharePanel } from './pages/victim/LocationSharePanel';
import { RequestList } from './pages/victim/RequestList';
import { RequestDetail } from './pages/victim/RequestDetail';
import { NearbyShelters } from './pages/victim/NearbyShelters';
import { Contacts } from './pages/victim/Contacts';
import { Notifications } from './pages/victim/Notifications';
import { Profile as VictimProfile } from './pages/victim/Profile';

// Volunteer Pages
import { VolunteerDashboard } from './pages/volunteer/VolunteerDashboard';
import { NearbyTasks } from './pages/volunteer/NearbyTasks';
import { ActiveTask } from './pages/volunteer/ActiveTask';
import { ResourceDelivery } from './pages/volunteer/ResourceDelivery';
import { ChatWindow } from './pages/volunteer/ChatWindow';
import { VolunteerMap } from './pages/volunteer/VolunteerMap';
import { History as VolunteerHistory } from './pages/volunteer/History';
import { Profile as VolunteerProfile } from './pages/volunteer/Profile';

// Rescue Pages
import { CommandDashboard } from './pages/rescue/CommandDashboard';
import { LiveMap } from './pages/rescue/LiveMap';
import { SOSMonitor } from './pages/rescue/SOSMonitor';
import { SOSDetail } from './pages/rescue/SOSDetail';
import { RescueOperations } from './pages/rescue/RescueOperations';
import { ResourceControl } from './pages/rescue/ResourceControl';
import { ShelterControl } from './pages/rescue/ShelterControl';
import { RescueChat } from './pages/rescue/RescueChat';
import { RescueAnalytics } from './pages/rescue/RescueAnalytics';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { EventManagement } from './pages/admin/EventManagement';
import { AdminResources } from './pages/admin/AdminResources';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { SystemHealth } from './pages/admin/SystemHealth';
import { AuditLogs } from './pages/admin/AuditLogs';

// System Pages
import { SyncCenter } from './pages/system/SyncCenter';
import { MeshNetwork } from './pages/system/MeshNetwork';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#070b13] flex items-center justify-center text-xs font-mono text-slate-500">Initializing Session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized roles back to their default dashboard
    if (user.role === 'VICTIM') return <Navigate to="/victim/dashboard" replace />;
    if (user.role === 'VOLUNTEER') return <Navigate to="/volunteer/dashboard" replace />;
    if (user.role === 'RESCUE') return <Navigate to="/rescue/dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/otp" element={<OTP />} />
      <Route path="/quick-access" element={<QuickAccess />} />
      <Route path="/help" element={<HelpCenter />} />

      {/* Victim Pages */}
      <Route
        path="/victim/dashboard"
        element={
          <ProtectedRoute allowedRoles={['VICTIM']}>
            <DashboardLayout><VictimDashboard /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/victim/sos"
        element={
          <ProtectedRoute allowedRoles={['VICTIM']}>
            <DashboardLayout><SOSEmergencyPanel /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/victim/requests/new"
        element={
          <ProtectedRoute allowedRoles={['VICTIM']}>
            <DashboardLayout><ResourceRequestForm /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/victim/medical"
        element={
          <ProtectedRoute allowedRoles={['VICTIM']}>
            <DashboardLayout><MedicalEmergencyForm /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/victim/requests"
        element={
          <ProtectedRoute allowedRoles={['VICTIM']}>
            <DashboardLayout><RequestList /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/victim/requests/:id"
        element={
          <ProtectedRoute allowedRoles={['VICTIM']}>
            <DashboardLayout><RequestDetail /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/victim/shelters"
        element={
          <ProtectedRoute allowedRoles={['VICTIM']}>
            <DashboardLayout><NearbyShelters /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/victim/location"
        element={
          <ProtectedRoute allowedRoles={['VICTIM']}>
            <DashboardLayout><LocationSharePanel /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/victim/contacts"
        element={
          <ProtectedRoute allowedRoles={['VICTIM']}>
            <DashboardLayout><Contacts /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/victim/notifications"
        element={
          <ProtectedRoute allowedRoles={['VICTIM']}>
            <DashboardLayout><Notifications /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/victim/profile"
        element={
          <ProtectedRoute allowedRoles={['VICTIM']}>
            <DashboardLayout><VictimProfile /></DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Volunteer Pages */}
      <Route
        path="/volunteer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['VOLUNTEER']}>
            <DashboardLayout><VolunteerDashboard /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteer/tasks/nearby"
        element={
          <ProtectedRoute allowedRoles={['VOLUNTEER']}>
            <DashboardLayout><NearbyTasks /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteer/tasks/active"
        element={
          <ProtectedRoute allowedRoles={['VOLUNTEER']}>
            <DashboardLayout><ActiveTask /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteer/delivery"
        element={
          <ProtectedRoute allowedRoles={['VOLUNTEER']}>
            <DashboardLayout><ResourceDelivery /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteer/chat"
        element={
          <ProtectedRoute allowedRoles={['VOLUNTEER']}>
            <DashboardLayout><ChatWindow /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteer/map"
        element={
          <ProtectedRoute allowedRoles={['VOLUNTEER']}>
            <DashboardLayout><VolunteerMap /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteer/history"
        element={
          <ProtectedRoute allowedRoles={['VOLUNTEER']}>
            <DashboardLayout><VolunteerHistory /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteer/profile"
        element={
          <ProtectedRoute allowedRoles={['VOLUNTEER']}>
            <DashboardLayout><VolunteerProfile /></DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Rescue Command Pages */}
      <Route
        path="/rescue/dashboard"
        element={
          <ProtectedRoute allowedRoles={['RESCUE', 'ADMIN']}>
            <DashboardLayout><CommandDashboard /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rescue/map"
        element={
          <ProtectedRoute allowedRoles={['RESCUE', 'ADMIN']}>
            <DashboardLayout><LiveMap /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rescue/sos"
        element={
          <ProtectedRoute allowedRoles={['RESCUE', 'ADMIN']}>
            <DashboardLayout><SOSMonitor /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rescue/sos/:id"
        element={
          <ProtectedRoute allowedRoles={['RESCUE', 'ADMIN']}>
            <DashboardLayout><SOSDetail /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rescue/operations"
        element={
          <ProtectedRoute allowedRoles={['RESCUE', 'ADMIN']}>
            <DashboardLayout><RescueOperations /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rescue/resources"
        element={
          <ProtectedRoute allowedRoles={['RESCUE', 'ADMIN']}>
            <DashboardLayout><ResourceControl /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rescue/shelters"
        element={
          <ProtectedRoute allowedRoles={['RESCUE', 'ADMIN']}>
            <DashboardLayout><ShelterControl /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rescue/chat"
        element={
          <ProtectedRoute allowedRoles={['RESCUE', 'ADMIN']}>
            <DashboardLayout><RescueChat /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rescue/analytics"
        element={
          <ProtectedRoute allowedRoles={['RESCUE', 'ADMIN']}>
            <DashboardLayout><RescueAnalytics /></DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Pages */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout><AdminDashboard /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout><UserManagement /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/emergencies"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout><EventManagement /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/resources"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout><AdminResources /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout><AdminAnalytics /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/health"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout><SystemHealth /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout><AuditLogs /></DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* System Pages */}
      <Route
        path="/sync"
        element={
          <ProtectedRoute>
            <DashboardLayout><SyncCenter /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mesh"
        element={
          <ProtectedRoute>
            <DashboardLayout><MeshNetwork /></DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <Router>
      <NetworkProvider>
        <AuthProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </AuthProvider>
      </NetworkProvider>
    </Router>
  );
}
