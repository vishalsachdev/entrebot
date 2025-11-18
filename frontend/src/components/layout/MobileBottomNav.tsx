import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Bot, TrendingUp, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const MobileBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Agents', path: '/agents', icon: Bot },
    { name: 'Progress', path: '/progress', icon: TrendingUp },
    { name: 'Settings', path: '/settings', icon: User },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
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
                  layoutId="mobileActiveTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-600 rounded-b-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
