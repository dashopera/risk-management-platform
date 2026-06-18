import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/stores/appStore';
import {
  LayoutDashboard,
  CheckSquare,
  Shield,
  Upload,
  Download,
  Search,
  Bell,
  Users,
  FileText,
  Settings,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react';
import type { UserRole } from '@/types/types';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    label: '工作台',
    path: '/',
    icon: <LayoutDashboard size={20} />,
    allowedRoles: ['admin', 'security_team', 'executive'],
  },
  {
    label: '我的任务',
    path: '/my-tasks',
    icon: <CheckSquare size={20} />,
    allowedRoles: ['risk_owner', 'handler'],
  },
  {
    label: '风险管理',
    path: '/risks',
    icon: <Shield size={20} />,
    allowedRoles: ['admin', 'security_team', 'risk_owner', 'handler', 'executive'],
  },
  {
    label: '批量导入',
    path: '/risks/import',
    icon: <Upload size={20} />,
    allowedRoles: ['admin', 'security_team'],
  },
  {
    label: '批量导出',
    path: '/risks/export',
    icon: <Download size={20} />,
    allowedRoles: ['admin', 'security_team', 'risk_owner', 'handler', 'executive'],
  },
  {
    label: '高级检索',
    path: '/risks/search',
    icon: <Search size={20} />,
    allowedRoles: ['admin', 'security_team', 'risk_owner', 'handler', 'executive'],
  },
  {
    label: '消息中心',
    path: '/notifications',
    icon: <Bell size={20} />,
    allowedRoles: ['admin', 'security_team', 'risk_owner', 'handler', 'executive'],
  },
  {
    label: '用户管理',
    path: '/users',
    icon: <Users size={20} />,
    allowedRoles: ['admin'],
  },
  {
    label: '审计日志',
    path: '/audit-logs',
    icon: <FileText size={20} />,
    allowedRoles: ['admin'],
  },
  {
    label: '系统设置',
    path: '/settings',
    icon: <Settings size={20} />,
    allowedRoles: ['admin'],
  },
  {
    label: '风险知识库',
    path: '/knowledge-base',
    icon: <BookOpen size={20} />,
    allowedRoles: ['admin', 'security_team', 'risk_owner', 'handler', 'executive'],
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar, unreadCount } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const filteredMenuItems = menuItems.filter(
    (item) => user && item.allowedRoles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 text-white transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-[220px]'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-slate-700">
          <Shield size={24} className="text-blue-400 shrink-0" />
          {!sidebarCollapsed && (
            <span className="ml-2 text-sm font-semibold whitespace-nowrap">
              安全风险管理
            </span>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-2">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } ${sidebarCollapsed ? 'justify-center' : ''}`
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!sidebarCollapsed && (
                <span className="ml-3 whitespace-nowrap">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center h-10 border-t border-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-slate-900 text-white flex flex-col">
            <div className="flex items-center justify-between h-14 px-4 border-b border-slate-700">
              <div className="flex items-center">
                <Shield size={24} className="text-blue-400" />
                <span className="ml-2 text-sm font-semibold">安全风险管理</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {filteredMenuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-400'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="ml-3 whitespace-nowrap">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center">
            <button
              className="md:hidden mr-3 text-gray-600"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <h2 className="text-base font-medium text-gray-800">网络安全风险管理平台</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <NavLink
              to="/notifications"
              className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>

            {/* User Avatar & Dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:block text-sm text-gray-700">{user?.name}</span>
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setUserMenuOpen(false);
                      }}
                    >
                      <User size={16} />
                      个人信息
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around h-14 z-40">
        {filteredMenuItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 text-xs transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            {item.icon}
            <span className="mt-0.5 text-[10px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
