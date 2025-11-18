import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export const Layout = ({ children, className }: LayoutProps) => (
  <div className={cn('min-h-screen bg-neutral-50', className)}>
    {children}
  </div>
);

export interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Container = ({ children, className, size = 'xl' }: ContainerProps) => {
  const sizes = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[1400px]',
    full: 'max-w-full',
  };

  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizes[size], className)}>
      {children}
    </div>
  );
};

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader = ({ title, description, actions, className }: PageHeaderProps) => (
  <div className={cn('mb-8', className)}>
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
        {description && (
          <p className="mt-2 text-neutral-600">{description}</p>
        )}
      </div>
      {actions && (
        <div className="ml-4 flex-shrink-0">{actions}</div>
      )}
    </div>
  </div>
);

export interface GridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 2 | 4 | 6 | 8;
  className?: string;
}

export const Grid = ({ children, cols = 3, gap = 6, className }: GridProps) => {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-12',
  };

  const gapClasses = {
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  return (
    <div className={cn('grid', colsClasses[cols], gapClasses[gap], className)}>
      {children}
    </div>
  );
};

export interface StackProps {
  children: ReactNode;
  direction?: 'horizontal' | 'vertical';
  spacing?: 2 | 4 | 6 | 8;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  className?: string;
}

export const Stack = ({
  children,
  direction = 'vertical',
  spacing = 4,
  align = 'stretch',
  justify = 'start',
  className,
}: StackProps) => {
  const directionClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col',
  };

  const spacingClasses = {
    horizontal: {
      2: 'gap-x-2',
      4: 'gap-x-4',
      6: 'gap-x-6',
      8: 'gap-x-8',
    },
    vertical: {
      2: 'gap-y-2',
      4: 'gap-y-4',
      6: 'gap-y-6',
      8: 'gap-y-8',
    },
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={cn(
        'flex',
        directionClasses[direction],
        spacingClasses[direction][spacing],
        alignClasses[align],
        justifyClasses[justify],
        className
      )}
    >
      {children}
    </div>
  );
};

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider = ({ orientation = 'horizontal', className }: DividerProps) => {
  const orientationClasses = {
    horizontal: 'w-full h-px',
    vertical: 'h-full w-px',
  };

  return (
    <div
      className={cn('bg-neutral-200', orientationClasses[orientation], className)}
      role="separator"
    />
  );
};

export default Layout;
