import React from 'react';
import { ESGPillar, CommitmentStatus, ESGLevel } from '../types';
import { Leaf, Heart, Shield, Award, Sparkles, AlertCircle, CheckCircle2, Clock, BookmarkCheck, FileCheck, ShieldCheck } from 'lucide-react';

export const PillarBadge: React.FC<{ pillar: ESGPillar; showLabel?: boolean }> = ({ pillar, showLabel = true }) => {
  const pillarConfigs = {
    E: {
      label: 'Environmental',
      bgColor: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      icon: Leaf,
    },
    S: {
      label: 'Social',
      bgColor: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      icon: Heart,
    },
    G: {
      label: 'Governance',
      bgColor: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      icon: Shield,
    },
  };

  const config = pillarConfigs[pillar];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${config.bgColor}`}>
      <Icon className="w-3.5 h-3.5" />
      {showLabel ? config.label : pillar}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: CommitmentStatus; lang?: 'ID' | 'EN'; compact?: boolean }> = ({ status, lang = 'ID', compact = false }) => {
  const isId = lang === 'ID';

  const statusConfigs = {
    'Not Started': {
      labelId: 'Belum Diambil',
      labelEn: 'Not Started',
      bgColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
      icon: Clock,
    },
    'In Progress': {
      labelId: compact ? 'Sudah Dikomit' : 'Sudah Dikomit (Belum Lapor)',
      labelEn: compact ? 'Committed' : 'Committed (Pending Report)',
      bgColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950/90 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold',
      icon: BookmarkCheck,
    },
    Submitted: {
      labelId: compact ? 'Sudah Dilaporkan' : 'Sudah Dilaporkan (Review)',
      labelEn: compact ? 'Submitted' : 'Submitted (In Review)',
      bgColor: 'bg-blue-100 text-blue-900 dark:bg-blue-950/90 dark:text-blue-200 border border-blue-300 dark:border-blue-700 font-bold',
      icon: FileCheck,
    },
    Verified: {
      labelId: compact ? 'Terverifikasi' : 'Terverifikasi Selesai',
      labelEn: compact ? 'Verified' : 'Verified & Completed',
      bgColor: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/90 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-bold',
      icon: ShieldCheck,
    },
    'Needs Info': {
      labelId: 'Perlu Revisi Bukti',
      labelEn: 'Needs Revision',
      bgColor: 'bg-rose-100 text-rose-900 dark:bg-rose-950/90 dark:text-rose-200 border border-rose-300 dark:border-rose-700 font-bold',
      icon: AlertCircle,
    },
  };

  const config = statusConfigs[status] || statusConfigs['Not Started'];
  const Icon = config.icon;
  const label = isId ? config.labelId : config.labelEn;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${config.bgColor}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
};

export const LevelBadge: React.FC<{ level: ESGLevel; size?: 'sm' | 'md' | 'lg' }> = ({ level, size = 'md' }) => {
  const levelConfigs = {
    Starter: {
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      icon: Clock,
    },
    Bronze: {
      bg: 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700',
      icon: Award,
    },
    Silver: {
      bg: 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-400 dark:border-slate-600',
      icon: Award,
    },
    Gold: {
      bg: 'bg-yellow-100 dark:bg-yellow-950/80 text-yellow-900 dark:text-yellow-200 border-yellow-400 dark:border-yellow-700',
      icon: Sparkles,
    },
    Champion: {
      bg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-600',
      icon: Sparkles,
    },
  };

  const config = levelConfigs[level] || levelConfigs.Starter;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-0.5 text-xs font-semibold gap-1.5',
    lg: 'px-3.5 py-1 text-sm font-bold gap-2',
  };

  return (
    <span className={`inline-flex items-center rounded-md border shadow-2xs ${config.bg} ${sizeClasses[size]}`}>
      <Icon className={size === 'lg' ? 'w-4 h-4 text-emerald-600 dark:text-emerald-400' : 'w-3.5 h-3.5'} />
      Level {level}
    </span>
  );
};
