import React from 'react';
import { motion } from 'motion/react';
import { Check, Lock, Sparkles, Award, Flag, ChevronRight } from 'lucide-react';

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  showLabel?: boolean;
  color?: 'emerald' | 'amber' | 'indigo' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showLabel = true,
  color = 'emerald',
  size = 'md',
  label,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorStyles = {
    emerald: 'bg-emerald-500 dark:bg-emerald-400',
    amber: 'bg-amber-500 dark:bg-amber-400',
    indigo: 'bg-indigo-500 dark:bg-indigo-400',
    blue: 'bg-blue-500 dark:bg-blue-400',
  };

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>{label || 'Progress'}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <motion.div
          className={`h-full rounded-full ${colorStyles[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export interface MilestoneNodeProps {
  id: string;
  title: string;
  subtitle: string;
  status: 'completed' | 'active' | 'locked';
  icon: React.ReactNode;
  levelNumber: number;
  onClick?: () => void;
}

export const DuolingoMilestonePath: React.FC<{
  milestones: MilestoneNodeProps[];
  currentScore: number;
}> = ({ milestones, currentScore }) => {
  return (
    <div className="relative py-4 flex flex-col items-center">
      {/* Background connector line */}
      <div className="absolute top-8 bottom-8 left-1/2 -translate-x-1/2 w-1 bg-slate-200 dark:bg-slate-800 z-0 rounded-full" />

      <div className="w-full space-y-6 relative z-10">
        {milestones.map((m, idx) => {
          const isCompleted = m.status === 'completed';
          const isActive = m.status === 'active';
          const isLocked = m.status === 'locked';

          // Zig-zag offset like Duolingo
          const offsetClass = idx % 2 === 0 ? 'translate-x-0' : idx % 3 === 1 ? 'translate-x-3' : '-translate-x-3';

          return (
            <motion.div
              key={m.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-center gap-4 ${offsetClass} justify-center cursor-pointer group`}
              onClick={m.onClick}
            >
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-4 shadow-md transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-300 text-white shadow-emerald-500/20'
                    : isActive
                    ? 'bg-amber-400 border-amber-200 text-slate-900 ring-4 ring-amber-400/30 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-7 h-7 stroke-[3]" />
                ) : isLocked ? (
                  <Lock className="w-6 h-6" />
                ) : (
                  m.icon
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl shadow-xs max-w-[220px] text-left group-hover:border-emerald-300 dark:group-hover:border-emerald-700 transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <span>Stage {m.levelNumber}</span>
                  {m.status === 'active' && (
                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-md text-[10px]">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {m.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {m.subtitle}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
