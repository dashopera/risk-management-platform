import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layouts/AppLayout';
import RequireAuth from '@/components/RequireAuth';

// Lazy load pages
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const MyTasks = lazy(() => import('@/pages/MyTasks'));
const RiskList = lazy(() => import('@/pages/RiskList'));
const RiskDetail = lazy(() => import('@/pages/RiskDetail'));
const RiskForm = lazy(() => import('@/pages/RiskForm'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const AuditLogs = lazy(() => import('@/pages/AuditLogs'));
const DataBackup = lazy(() => import('@/pages/DataBackup'));
const Settings = lazy(() => import('@/pages/Settings'));
const KnowledgeBase = lazy(() => import('@/pages/KnowledgeBase'));
const RiskImport = lazy(() => import('@/pages/RiskImport'));
const RiskExport = lazy(() => import('@/pages/RiskExport'));
const RiskSearch = lazy(() => import('@/pages/RiskSearch'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<RequireAuth allowedRoles={['admin', 'security_team', 'executive']}><Dashboard /></RequireAuth>} />
          <Route path="my-tasks" element={<RequireAuth allowedRoles={['risk_owner', 'handler']}><MyTasks /></RequireAuth>} />
          <Route path="risks" element={<RiskList />} />
          <Route path="risks/new" element={<RequireAuth allowedRoles={['admin', 'security_team']}><RiskForm /></RequireAuth>} />
          <Route path="risks/import" element={<RequireAuth allowedRoles={['admin', 'security_team']}><RiskImport /></RequireAuth>} />
          <Route path="risks/export" element={<RiskExport />} />
          <Route path="risks/search" element={<RiskSearch />} />
          <Route path="risks/:id" element={<RiskDetail />} />
          <Route path="risks/:id/edit" element={<RequireAuth allowedRoles={['admin', 'security_team']}><RiskForm /></RequireAuth>} />
          <Route path="knowledge-base" element={<KnowledgeBase />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="users" element={<RequireAuth allowedRoles={['admin']}><UserManagement /></RequireAuth>} />
          <Route path="audit-logs" element={<RequireAuth allowedRoles={['admin']}><AuditLogs /></RequireAuth>} />
          <Route path="data-backup" element={<RequireAuth allowedRoles={['admin']}><DataBackup /></RequireAuth>} />
          <Route path="settings" element={<RequireAuth allowedRoles={['admin']}><Settings /></RequireAuth>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
