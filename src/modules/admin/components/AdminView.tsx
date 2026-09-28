import React, { useEffect, useState } from 'react';
import { useAdminData } from '../hooks/useAdminData';
import { useAuth } from '../../../core/context/AuthContext';
import { actionService } from '../../../core/services/actionService';
import { learnService } from '../../../core/services/learnService';
import { newsletterService } from '../../newsletter/services/newsletterService';
import { Button } from '../../../core/ui/Button';
import { StatusBadge } from '../../../core/ui/Badges';
import { NewsletterCMSPanel } from '../../newsletter/components/NewsletterCMSPanel';
import { AdminActionCatalogManager } from './AdminActionCatalogManager';
import { AdminCourseCreatorStudio } from './AdminCourseCreatorStudio';
import { CorporateGridDashboard } from './CorporateGridDashboard';
import { SuperAdminPanel } from './SuperAdminPanel';
import { authObjectUrl } from '../../../core/services/api';
import { useLanguage } from '../../../core/context/LanguageContext';

export const AdminView: React.FC = () => {
  const { dbUser, vendorsList, allUsersList } = useAuth();
  const { isId } = useLanguage();
  const {
    queue,
    metrics,
    verifyCommitment,
    requestInformation,
    isLoading,
  } = useAdminData();

  const isSuperAdmin = dbUser?.role === 'super_admin';
  const isAdminOrSuper = isSuperAdmin || dbUser?.role === 'admin';

  const [adminTab, setAdminTab] = useState<'overview' | 'corporate-grid' | 'superadmin' | 'audit' | 'catalog' | 'learning' | 'cms'>('overview');
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  const [filterText, setFilterText] = useState('');
  const [counts, setCounts] = useState({ actions: 0, lessons: 0, slides: 0, articles: 0 });

  useEffect(() => {
    if (!isSuperAdmin) return;
    Promise.all([
      actionService.getActions(),
      learnService.getAllModules(),
      newsletterService.getHeroSlides(false),
      newsletterService.getAllArticles(),
    ]).then(([actions, lessons, slides, articles]) => {
      setCounts({ actions: actions.length, lessons: lessons.length, slides: slides.length, articles: articles.length });
    }).catch(() => {});
  }, [isSuperAdmin]);

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
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm italic text-slate-600 dark:text-slate-300">
          {isId
            ? 'Angka hijau adalah jumlah sekarang. Buka baris hanya kalau ada yang perlu diubah.'
            : 'The green numbers are the live counts. Open a row only when you need to change something.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl bg-slate-300 px-2 py-2 text-sm dark:bg-slate-800">
        {([
          ['overview', isId ? 'Mulai' : 'Start', true],
          ['corporate-grid', isId ? 'Vendor' : 'Vendors', isAdminOrSuper],
          ['superadmin', isId ? 'Daftar' : 'Roster', isSuperAdmin],
          ['audit', `${isId ? 'Bukti' : 'Proof'} (${queue.length})`, isAdminOrSuper],
          ['catalog', isId ? 'Aksi' : 'Actions', isSuperAdmin],
          ['learning', isId ? 'Belajar' : 'Learn', isSuperAdmin],
          ['cms', isId ? 'Buletin' : 'Bulletin', isSuperAdmin],
        ] as const).filter(([, , show]) => show).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAdminTab(id)}
            className={`rounded-lg px-4 py-2 font-semibold cursor-pointer ${
              adminTab === id ? 'bg-emerald-600 text-white' : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {adminTab === 'overview' ? (
        <div>
          {metrics?.totals && (
            <div className="mb-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {[
                [isId ? 'Pohon' : 'Trees', metrics.totals.treesPlanted],
                ['kWh', metrics.totals.energySavedKwh],
                [isId ? 'Kertas kg' : 'Paper kg', metrics.totals.paperReducedKg],
                [isId ? 'Limbah kg' : 'Waste kg', metrics.totals.wasteRecycledKg],
                [isId ? 'Air L' : 'Water L', metrics.totals.waterSavedLiters],
                [isId ? 'Orang' : 'People', metrics.totals.peopleBenefited],
              ].map(([label, value]) => (
                <p key={String(label)}>
                  <span className="block text-sm font-semibold text-emerald-500">{label}</span>
                  <span className="text-3xl font-semibold text-emerald-500">{value}</span>
                </p>
              ))}
            </div>
          )}
          <div className="divide-y divide-slate-300 dark:divide-slate-800">
            {([
              ['corporate-grid', isId ? 'Vendor' : 'Vendors', metrics ? (isId ? `${metrics.activeVendors} aktif` : `${metrics.activeVendors} active`) : (isId ? 'Perusahaan dan skor' : 'Companies and scores'), metrics?.totalVendors ?? 0, isAdminOrSuper],
              ['superadmin', isId ? 'Daftar' : 'Roster', isId ? `${allUsersList.length} orang yang bisa masuk` : `${allUsersList.length} people who can sign in`, vendorsList.length, isSuperAdmin],
              ['audit', isId ? 'Bukti' : 'Proof', isId ? 'Menunggu disetujui atau berkas yang lebih jelas' : 'Waiting for a yes or a clearer file', queue.length, isAdminOrSuper],
              ['catalog', isId ? 'Aksi' : 'Actions', isId ? 'Yang bisa dipilih vendor' : 'What vendors can pick', counts.actions, isSuperAdmin],
              ['learning', isId ? 'Belajar' : 'Learn', isId ? 'Pelajaran di katalog' : 'Lessons in the catalog', counts.lessons, isSuperAdmin],
              ['cms', isId ? 'Buletin' : 'Bulletin', isId ? `${counts.articles} artikel` : `${counts.articles} articles`, counts.slides, isSuperAdmin],
            ] as const).filter((row) => row[4]).map(([id, title, body, n]) => (
              <button
                key={id}
                type="button"
                onClick={() => setAdminTab(id)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left cursor-pointer"
              >
                <span>
                  <span className="block text-lg font-semibold text-emerald-500">{title}</span>
                  <span className="mt-1 block text-sm italic text-slate-600 dark:text-slate-300">{body}</span>
                </span>
                <span className="text-3xl font-semibold text-emerald-500">{n}</span>
              </button>
            ))}
          </div>
        </div>
      ) : adminTab === 'corporate-grid' ? (
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
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">{isId ? 'Bukti' : 'Proof'}</h2>
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder={isId ? 'Saring vendor atau aksi' : 'Filter by vendor or action'}
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {filteredQueue.length === 0 ? (
              <p className="text-sm italic text-slate-600 dark:text-slate-300">{isId ? 'Tidak ada yang menunggu. Angkanya sudah ada di Mulai.' : 'Nothing is waiting. The counts on Start already include this.'}</p>
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
