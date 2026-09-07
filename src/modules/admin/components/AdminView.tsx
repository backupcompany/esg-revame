import React, { useState } from 'react';
import { useAdminData } from '../hooks/useAdminData';
import { useAuth } from '../../../core/context/AuthContext';
import { BaseCard, MetricCard } from '../../../core/ui/Cards';
import { Button } from '../../../core/ui/Button';
import { StatusBadge } from '../../../core/ui/Badges';
import { NewsletterCMSPanel } from '../../newsletter/components/NewsletterCMSPanel';
import { AdminActionCatalogManager } from './AdminActionCatalogManager';
import { AdminCourseCreatorStudio } from './AdminCourseCreatorStudio';
import { CorporateGridDashboard } from './CorporateGridDashboard';
import { SuperAdminPanel } from './SuperAdminPanel';
import { BRAND_LOGO } from '../../../core/ui/assets';
import { authObjectUrl } from '../../../core/services/api';
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  Building2,
  FileSpreadsheet,
  Globe,
  Compass,
  BookOpen
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { dbUser } = useAuth();
  const {
    queue,
    metrics,
    verifyCommitment,
    requestInformation,
    isLoading,
  } = useAdminData();

  const isSuperAdmin = dbUser?.role === 'super_admin';
  const isAdminOrSuper = isSuperAdmin || dbUser?.role === 'admin';

  const [adminTab, setAdminTab] = useState<'corporate-grid' | 'superadmin' | 'audit' | 'catalog' | 'learning' | 'cms'>(
    isAdminOrSuper ? 'corporate-grid' : 'audit'
  );
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  const [filterText, setFilterText] = useState('');

  const handleVerify = async (commitmentId: string) => {
    const fb = feedbackMap[commitmentId] || 'Verified and approved by Ecosystem ESG Audit Team.';
    await verifyCommitment(commitmentId, fb);
  };

  const handleRequestInfo = async (commitmentId: string) => {
    const fb = feedbackMap[commitmentId] || 'Please provide additional photos or receipt documents.';
    await requestInformation(commitmentId, fb);
  };

  const filteredQueue = queue.filter(
    item =>
      item.vendorName.toLowerCase().includes(filterText.toLowerCase()) ||
      item.actionTitle.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-left">
      {/* Header Banner */}
      <BaseCard padding="lg" className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-none shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
              <img
                src={BRAND_LOGO}
                alt="Siloam Hospitals"
                className="h-8 w-auto bg-white/90 p-1 rounded-lg"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-md text-xs font-bold uppercase tracking-wider text-emerald-100">
                Siloam ESG Orchestrator ({dbUser?.role ? dbUser.role.replace('_', ' ').toUpperCase() : 'ADMIN'})
              </span>
            </div>
            <h1 className="text-2xl font-black">Corporate ESG Review & Administration Portal</h1>
            <p className="text-xs text-emerald-100 max-w-xl">
              Review corporate vendor ESG grids, manage company email rosters with Excel bulk upload, audit sustainability proofs, and govern supply chain standards.
            </p>
          </div>

          {metrics && (
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20 text-center min-w-[180px]">
              <span className="text-xs text-emerald-200 uppercase font-semibold block">Active Vendors</span>
              <span className="text-2xl font-bold">{metrics.activeVendors} / {metrics.totalVendors}</span>
            </div>
          )}
        </div>
      </BaseCard>

      {/* Admin Primary Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {isAdminOrSuper && (
          <button
            onClick={() => setAdminTab('corporate-grid')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              adminTab === 'corporate-grid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Corporate Grid & ESG Dashboard</span>
          </button>
        )}

        {isSuperAdmin && (
          <button
            onClick={() => setAdminTab('superadmin')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              adminTab === 'superadmin'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Superadmin & Excel Upload</span>
          </button>
        )}

        {isAdminOrSuper && (
          <button
            onClick={() => setAdminTab('audit')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              adminTab === 'audit'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Bukti ({queue.length})</span>
          </button>
        )}

        {isSuperAdmin && (
          <>
            <button
              onClick={() => setAdminTab('catalog')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                adminTab === 'catalog'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Katalog Aksi</span>
            </button>

            <button
              onClick={() => setAdminTab('learning')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                adminTab === 'learning'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Micro-Learning</span>
            </button>

            <button
              onClick={() => setAdminTab('cms')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                adminTab === 'cms'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>CMS Buletin</span>
            </button>
          </>
        )}
      </div>

      {adminTab === 'corporate-grid' ? (
        <CorporateGridDashboard />
      ) : adminTab === 'superadmin' ? (
        <SuperAdminPanel />
      ) : adminTab === 'cms' ? (
        <NewsletterCMSPanel />
      ) : adminTab === 'learning' ? (
        <AdminCourseCreatorStudio />
      ) : adminTab === 'catalog' ? (
        <AdminActionCatalogManager />
      ) : (
        <>
          {/* Collective Ecosystem Impact Grid */}
          {metrics && metrics.totals && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" /> Aggregated Ecosystem Metrics (All Vendors)
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <MetricCard
                  title="Trees Planted"
                  value={metrics.totals.treesPlanted.toLocaleString()}
                  unit="trees"
                  icon={<div className="text-emerald-600">🌳</div>}
                />
                <MetricCard
                  title="Energy Saved"
                  value={metrics.totals.energySavedKwh.toLocaleString()}
                  unit="kWh"
                  icon={<div className="text-emerald-600">⚡</div>}
                />
                <MetricCard
                  title="Waste Recycled"
                  value={(metrics.totals.wasteRecycledKg / 1000).toFixed(1)}
                  unit="tons"
                  icon={<div className="text-emerald-600">♻️</div>}
                />
                <MetricCard
                  title="Water Saved"
                  value={metrics.totals.waterSavedLiters.toLocaleString()}
                  unit="liters"
                  icon={<div className="text-emerald-600">💧</div>}
                />
                <MetricCard
                  title="Active Vendors"
                  value={metrics.activeVendors}
                  unit={`of ${metrics.totalVendors}`}
                  icon={<div className="text-emerald-600">🏢</div>}
                />
              </div>
            </div>
          )}

          {/* Audit Queue Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Vendor Evidence Verification Queue
              </h2>
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Filter by vendor or action..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {filteredQueue.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">All proof submissions are verified!</h3>
                <p className="text-xs text-slate-500 mt-1">There are no pending vendor evidence proofs waiting in the queue.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQueue.map(item => (
                  <div key={item.commitment.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded">
                            Committed: {item.commitment.committedDate ? new Date(item.commitment.committedDate).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{item.vendorName}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Action: {item.actionTitle}</p>
                      </div>
                      <StatusBadge status={item.commitment.status} />
                    </div>

                    {item.commitment.evidenceFiles && item.commitment.evidenceFiles.length > 0 && (
                      <div className="space-y-2">
                        {item.commitment.evidenceFiles.map((file, fIdx) => (
                          <div key={fIdx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                              <span>📎 Attached File:</span>
                              <span className="font-bold text-emerald-600">{file.fileName}</span>
                            </div>
                            {file.fileUrl && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const url = file.fileUrl.startsWith('/api/')
                                    ? await authObjectUrl(file.fileUrl)
                                    : file.fileUrl;
                                  if (url) window.open(url, '_blank', 'noopener,noreferrer');
                                }}
                                className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
                              >
                                View File
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Auditor Feedback / Review Note</label>
                      <input
                        type="text"
                        placeholder="Enter feedback or approval notes..."
                        value={feedbackMap[item.commitment.id] || ''}
                        onChange={(e) => setFeedbackMap({ ...feedbackMap, [item.commitment.id]: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-2">
                      <Button
                        variant="secondary"
                        onClick={() => handleRequestInfo(item.commitment.id)}
                      >
                        Request Info
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleVerify(item.commitment.id)}
                      >
                        Verify & Award Points
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
