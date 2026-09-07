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

  const interactiveStyles = onClick || hoverEffect
    ? 'hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900/60 transition-all duration-200 cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs ${paddingStyles[padding]} ${interactiveStyles} ${className}`}
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
  const themeStyles = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
    blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  };

  const badgeStyles = {
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  };

  return (
    <BaseCard padding="md" className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          {icon && (
            <div className={`p-2 rounded-lg ${themeStyles[colorTheme]}`}>
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
            <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${badgeStyles[badgeType]}`}>
              {badgeText}
            </span>
          )}
        </div>
      )}
    </BaseCard>
  );
};
