import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export const BaseCard: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverEffect = true,
  padding = 'md',
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      onClick={onClick}
      className={`${paddingStyles[padding]} ${onClick ? 'cursor-pointer' : ''} ${className} !bg-transparent !border-0 !shadow-none`}
    >
      {children}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'info';
  colorTheme?: 'emerald' | 'amber' | 'indigo' | 'blue' | 'slate';
  description?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  badgeText,
  badgeType = 'success',
  colorTheme = 'emerald',
  description,
}) => {
  void badgeType;
  void colorTheme;
  return (
    <BaseCard padding="md" className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          {icon && (
            <div className="text-slate-400">
              {icon}
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-1.5 my-1">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {unit}
            </span>
          )}
        </div>
      </div>
      {(badgeText || description) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          {description && (
            <span className="text-slate-500 dark:text-slate-400 truncate">{description}</span>
          )}
          {badgeText && (
            <span className="text-[11px] font-medium text-slate-500">
              {badgeText}
            </span>
          )}
        </div>
      )}
    </BaseCard>
  );
};
