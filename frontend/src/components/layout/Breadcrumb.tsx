import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-2 text-sm', className)}
    >
      <Link
        to="/"
        className="text-neutral-600 hover:text-neutral-900 transition-colors"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-neutral-400" />
            {item.path && !isLast ? (
              <Link
                to={item.path}
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  isLast
                    ? 'text-neutral-900 font-medium'
                    : 'text-neutral-600'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
