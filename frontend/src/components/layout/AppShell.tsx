import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Bot,
  TrendingUp,
  History,
  Settings,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Badge } from '../ui';
import { cn } from '../../utils/cn';

interface AppShellProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Projects', path: '/projects', icon: FolderKanban },
  { name: 'Agents', path: '/agents', icon: Bot },
  { name: 'Progress', path: '/progress', icon: TrendingUp },
  { name: 'History', path: '/history', icon: History },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const AppShell = ({ children }: AppShellProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VB</span>
              </div>
              <span className="hidden sm:block text-xl font-bold text-neutral-900">
                VentureBot
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative',
                    isActive
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                  {item.badge && (
                    <Badge variant="primary" size="sm">
                      {item.badge}
                    </Badge>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary-50 rounded-lg -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-neutral-100 rounded-lg">
              <User className="h-4 w-4 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-900">
                {user?.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              leftIcon={<LogOut className="h-4 w-4" />}
              className="hidden sm:flex"
            >
              Sign Out
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="sm:hidden"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
            />

            {/* Mobile Menu */}
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-neutral-200 z-40 lg:hidden overflow-y-auto"
            >
              <div className="p-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'text-primary-700 bg-primary-50'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                      {item.badge && (
                        <Badge variant="primary" size="sm" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile User Info */}
              <div className="p-4 border-t border-neutral-200 mt-auto">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-neutral-600 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)] pb-20 lg:pb-0">{children}</main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center flex-1 h-full"
              >
                <div
                  className={cn(
                    'flex flex-col items-center justify-center transition-colors',
                    isActive ? 'text-primary-600' : 'text-neutral-600'
                  )}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="appShellMobileActiveTab"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-600 rounded-b-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AppShell;
