import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../core/context/AuthContext';
import { apiFetch } from '../../../core/services/api';
import { BaseCard, MetricCard } from '../../../core/ui/Cards';
import { Button } from '../../../core/ui/Button';
import { StatusBadge, LevelBadge } from '../../../core/ui/Badges';
import { Building2, Search, Filter, ShieldCheck, Mail, Phone, MapPin, Award, CheckCircle2, AlertTriangle, ChevronRight, Eye } from 'lucide-react';

interface CorporateVendor {
  id: number;
  companyName: string;
  industry: string;
  employeeCount: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  verificationStatus: string;
  allowedEmails: string[];
  latestAssessment?: {
    overallPercentage: number;
    maturityLevel: string;
    pillarResults: Record<string, any>;
    completedAt: string;
  };
  assessmentCount: number;
  actionsCount: number;
  completedActionsCount: number;
}

export const CorporateGridDashboard: React.FC = () => {
  const { user, dbUser } = useAuth();
  const [vendors, setVendors] = useState<CorporateVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedVendor, setSelectedVendor] = useState<CorporateVendor | null>(null);

  const fetchCorporateData = async () => {
    try {
      const params = new URLSearchParams({ limit: '20', offset: '0' });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (statusFilter && statusFilter !== 'All') params.set('status', statusFilter);
      const res = await apiFetch(`/api/admin/corporate-grid?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors || []);
      }
    } catch (err) {
      console.error("Error fetching corporate grid:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user || dbUser) {
      fetchCorporateData();
    }
  }, [user, dbUser]);

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (v.contactPerson && v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          v.allowedEmails.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || v.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Loading Corporate ESG Grid...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 rounded-lg text-xs font-bold uppercase tracking-wider">
              Corporate ESG Governance & Review Grid
            </span>
          </div>
          <h1 className="text-2xl font-black">All Partner Vendor ESG Portfolios</h1>
          <p className="text-xs text-emerald-100 max-w-2xl">
            Review comprehensive ESG scores, maturity levels, verified impact achievements, and authorized contact directories across all supplier network enterprises.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-center">
            <span className="text-[10px] uppercase font-semibold text-emerald-200 block">Total Vendors</span>
            <span className="text-2xl font-bold">{vendors.length}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, industry, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['All', 'Verified', 'Pending', 'Needs Review'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Corporate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVendors.map(vendor => {
          const score = vendor.latestAssessment?.overallPercentage || 0;
          const level = vendor.latestAssessment?.maturityLevel || 'Starter';
          return (
            <div
              key={vendor.id}
              onClick={() => setSelectedVendor(vendor)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                      {vendor.companyName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-emerald-600 transition-colors">
                        {vendor.companyName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{vendor.industry} • {vendor.employeeCount} employees</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                    vendor.verificationStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                    vendor.verificationStatus === 'Needs Review' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {vendor.verificationStatus}
                  </span>
                </div>

                {/* ESG Score & Maturity */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">ESG Maturity Level</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{level}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Overall Score</span>
                    <span className="text-lg font-black text-slate-900 dark:text-slate-100">{Math.round(score)}%</span>
                  </div>
                </div>

                {/* Contact & Emails */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Contact:</span>
                    <span>{vendor.contactPerson || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{vendor.allowedEmails.length > 0 ? vendor.allowedEmails.join(', ') : 'No authorized emails'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>View Detailed ESG Dashboard</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {filteredVendors.length === 0 && (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No vendor companies found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or status filters.</p>
        </div>
      )}

      {/* Vendor Detailed ESG Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl">
                  {selectedVendor.companyName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{selectedVendor.companyName}</h2>
                  <p className="text-xs text-slate-500">{selectedVendor.industry} • {selectedVendor.employeeCount} employees • Status: <span className="font-bold text-emerald-600">{selectedVendor.verificationStatus}</span></p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Allowed Emails */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Authorized Sign-In Emails ({selectedVendor.allowedEmails.length})</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedVendor.allowedEmails.length > 0 ? (
                    selectedVendor.allowedEmails.map((em, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200">
                        {em}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No authorized emails assigned yet.</span>
                  )}
                </div>
              </div>

              {/* ESG Score Overview */}
              {selectedVendor.latestAssessment ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 text-center">
                      <span className="text-xs text-emerald-700 dark:text-emerald-300 uppercase font-semibold">Overall ESG Score</span>
                      <span className="text-3xl font-black text-emerald-800 dark:text-emerald-200 mt-1 block">
                        {Math.round(selectedVendor.latestAssessment.overallPercentage)}%
                      </span>
                    </div>
                    <div className="p-4 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-900 text-center">
                      <span className="text-xs text-teal-700 dark:text-teal-300 uppercase font-semibold">Maturity Level</span>
                      <span className="text-2xl font-bold text-teal-800 dark:text-teal-200 mt-1 block">
                        {selectedVendor.latestAssessment.maturityLevel}
                      </span>
                    </div>
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900 text-center">
                      <span className="text-xs text-indigo-700 dark:text-indigo-300 uppercase font-semibold">Completed Actions</span>
                      <span className="text-2xl font-bold text-indigo-800 dark:text-indigo-200 mt-1 block">
                        {selectedVendor.completedActionsCount} / {selectedVendor.actionsCount}
                      </span>
                    </div>
                  </div>

                  {/* Pillar Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">ESG Pillar Breakdown</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {Object.entries(selectedVendor.latestAssessment.pillarResults || {}).map(([pillar, data]: [string, any]) => (
                        <div key={pillar} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">{pillar} Pillar</span>
                            <span className="text-xs font-extrabold text-emerald-600">{Math.round(data.percentage || 0)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, data.percentage || 0)}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No ESG Assessment Completed Yet</p>
                  <p className="text-xs text-slate-500 mt-1">This vendor company has not yet submitted their baseline ESG assessment.</p>
                </div>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <Button onClick={() => setSelectedVendor(null)}>Close Dashboard</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
