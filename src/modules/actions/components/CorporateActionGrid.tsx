import React, { useState, useMemo } from 'react';
import { ESGAction, ESGCommitment, ESGPillar } from '../../../core/types';
import { PillarBadge, StatusBadge } from '../../../core/ui/Badges';
import { Button } from '../../../core/ui/Button';
import { PLACEHOLDER_IMAGE, catalogImage } from '../../../core/ui/assets';
import { ArrowUpDown, ChevronRight, Sparkles, CheckCircle2, Clock, Camera, FileText, ShieldAlert, ArrowUp, ArrowDown, BookmarkCheck, FileCheck, ShieldCheck, CircleDashed } from 'lucide-react';

interface CorporateActionGridProps {
  actions: ESGAction[];
  commitments: ESGCommitment[];
  onSelectAction: (action: ESGAction) => void;
  lang?: 'ID' | 'EN';
}

type SortField = 'title' | 'pillar' | 'category' | 'difficulty' | 'points' | 'status';
type SortOrder = 'asc' | 'desc';

export const CorporateActionGrid: React.FC<CorporateActionGridProps> = ({
  actions,
  commitments,
  onSelectAction,
  lang = 'ID',
}) => {
  const isId = lang === 'ID';

  const [sortField, setSortField] = useState<SortField>('points');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    actions.forEach(a => {
      if (isId && a.categoryId) set.add(a.categoryId);
      else set.add(a.category);
    });
    return Array.from(set);
  }, [actions, isId]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedActions = useMemo(() => {
    return actions
      .filter(act => {
        if (categoryFilter !== 'ALL') {
          const cat = isId ? (act.categoryId || act.category) : act.category;
          if (cat !== categoryFilter) return false;
        }
        if (difficultyFilter !== 'ALL' && act.difficulty !== difficultyFilter) {
          return false;
        }
        if (statusFilter !== 'ALL') {
          const cmt = commitments.find(c => c.actionId === act.id);
          const currentStatus = cmt ? cmt.status : 'Not Started';
          if (statusFilter === 'Committed' && !cmt) return false;
          if (statusFilter === 'Not Committed' && cmt) return false;
          if (statusFilter === 'Reported' && (!cmt || (cmt.status !== 'Submitted' && cmt.status !== 'Verified'))) return false;
          if (statusFilter !== 'Committed' && statusFilter !== 'Not Committed' && statusFilter !== 'Reported' && currentStatus !== statusFilter) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField as keyof ESGAction];
        let valB: any = b[sortField as keyof ESGAction];

        if (sortField === 'title') {
          valA = isId ? (a.titleId || a.title) : a.title;
          valB = isId ? (b.titleId || b.title) : b.title;
        } else if (sortField === 'category') {
          valA = isId ? (a.categoryId || a.category) : a.category;
          valB = isId ? (b.categoryId || b.category) : b.category;
        } else if (sortField === 'status') {
          const cmtA = commitments.find(c => c.actionId === a.id);
          const cmtB = commitments.find(c => c.actionId === b.id);
          valA = cmtA ? cmtA.status : 'Not Started';
          valB = cmtB ? cmtB.status : 'Not Started';
        }

        if (typeof valA === 'string') {
          const cmp = valA.localeCompare(valB);
          return sortOrder === 'asc' ? cmp : -cmp;
        } else {
          return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
        }
      });
  }, [actions, commitments, categoryFilter, difficultyFilter, statusFilter, sortField, sortOrder, isId]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400 font-bold" />
    );
  };

  return (
    <div className="space-y-3">
      {/* Table Level Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-500">{isId ? 'Filter Grid:' : 'Grid Filters:'}</span>
          
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">{isId ? 'Semua Kategori' : 'All Categories'}</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Difficulty filter */}
          <select
            value={difficultyFilter}
            onChange={e => setDifficultyFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">{isId ? 'Semua Tingkat Kesulitan' : 'All Difficulties'}</option>
            <option value="Starter">Starter (Dasar)</option>
            <option value="Moderate">Moderate (Menengah)</option>
            <option value="Advanced">Advanced (Lanjutan)</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">{isId ? 'Semua Status Komitmen' : 'All Commitment Status'}</option>
            <option value="Committed">{isId ? '📌 Sudah Dikomit' : '📌 Committed'}</option>
            <option value="Reported">{isId ? '📤 Sudah Dilaporkan' : '📤 Reported / Submitted'}</option>
            <option value="Verified">{isId ? '✅ Terverifikasi' : '✅ Verified'}</option>
            <option value="Not Committed">{isId ? '⚪ Belum Diambil' : '⚪ Not Committed'}</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          {isId ? `Menampilkan ${filteredAndSortedActions.length} dari ${actions.length} inisiatif` : `Showing ${filteredAndSortedActions.length} of ${actions.length} actions`}
        </div>
      </div>

      {/* Corporate Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700 select-none">
              <th className="py-3 px-3.5 w-14 text-center">{isId ? 'Foto' : 'Img'}</th>
              <th
                onClick={() => handleSort('title')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>{isId ? 'Inisiatif Aksi ESG' : 'Action Initiative'}</span>
                  {renderSortIcon('title')}
                </div>
              </th>
              <th
                onClick={() => handleSort('pillar')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group text-center w-20"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{isId ? 'Pilar' : 'Pillar'}</span>
                  {renderSortIcon('pillar')}
                </div>
              </th>
              <th
                onClick={() => handleSort('category')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group hidden md:table-cell"
              >
                <div className="flex items-center gap-1">
                  <span>{isId ? 'Kategori' : 'Category'}</span>
                  {renderSortIcon('category')}
                </div>
              </th>
              <th
                onClick={() => handleSort('difficulty')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group text-center w-28 hidden lg:table-cell"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{isId ? 'Tingkat' : 'Level'}</span>
                  {renderSortIcon('difficulty')}
                </div>
              </th>
              <th className="py-3 px-3 hidden sm:table-cell">
                <span>{isId ? 'Target Metrik' : 'Impact Target'}</span>
              </th>
              <th
                onClick={() => handleSort('points')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group text-right w-24"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Poin</span>
                  {renderSortIcon('points')}
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group text-center w-36"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{isId ? 'Status Katalog' : 'Catalog Status'}</span>
                  {renderSortIcon('status')}
                </div>
              </th>
              <th className="py-3 px-3.5 text-center w-24">{isId ? 'Aksi' : 'Action'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredAndSortedActions.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  {isId ? 'Tidak ada aksi yang sesuai dengan kriteria filter.' : 'No actions match the selected filter criteria.'}
                </td>
              </tr>
            ) : (
              filteredAndSortedActions.map((act) => {
                const existingCommitment = commitments.find(c => c.actionId === act.id);
                const displayTitle = isId ? (act.titleId || act.title) : act.title;
                const displayCategory = isId ? (act.categoryId || act.category) : act.category;
                const displayMetric = isId ? (act.impactMetricUnitId || act.impactMetricUnit) : act.impactMetricUnit;

                return (
                  <tr
                    key={act.id}
                    onClick={() => onSelectAction(act)}
                    className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer group"
                  >
                    {/* Thumbnail Image */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="w-11 h-9 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 mx-auto">
                        <img
                          src={catalogImage(act.imageUrl, 400)}
                          alt={displayTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                        />
                      </div>
                    </td>

                    {/* Action Title & Code */}
                    <td className="py-2.5 px-3.5">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {displayTitle}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="font-mono">{act.id}</span>
                          <span className="md:hidden">• {displayCategory}</span>
                        </div>
                      </div>
                    </td>

                    {/* Pillar Badge */}
                    <td className="py-2.5 px-3 text-center">
                      <PillarBadge pillar={act.pillar} />
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-400 hidden md:table-cell">
                      {displayCategory}
                    </td>

                    {/* Difficulty */}
                    <td className="py-2.5 px-3 text-center hidden lg:table-cell">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          act.difficulty === 'Starter'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : act.difficulty === 'Moderate'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {act.difficulty}
                      </span>
                    </td>

                    {/* Target Metric */}
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                      <div className="font-medium text-[11px] text-slate-800 dark:text-slate-200">
                        {displayMetric}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ~{act.estimatedDays} {isId ? 'Hari' : 'Days'}
                      </div>
                    </td>

                    {/* Points */}
                    <td className="py-2.5 px-3 text-right">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3" /> +{act.points}
                      </span>
                    </td>

                    {/* Commitment & Report Status with distinct Icon */}
                    <td className="py-2.5 px-3.5 text-center">
                      {existingCommitment ? (
                        <StatusBadge status={existingCommitment.status} lang={lang} compact />
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-500 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700">
                          <CircleDashed className="w-3.5 h-3.5" />
                          <span>{isId ? 'Belum Diambil' : 'Not Started'}</span>
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-2.5 px-3.5 text-center">
                      <Button
                        variant={existingCommitment ? 'secondary' : 'primary'}
                        size="sm"
                        icon={<ChevronRight className="w-3 h-3" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAction(act);
                        }}
                      >
                        {existingCommitment ? (isId ? 'Detail' : 'View') : (isId ? 'Pilih' : 'Select')}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
