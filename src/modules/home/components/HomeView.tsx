import React from 'react';
import { useHomeData } from '../hooks/useHomeData';
import { PrimaryTab } from '../../../core/types';
import { useLanguage } from '../../../core/context/LanguageContext';
import {
  Sparkles,
  Award,
  TrendingUp,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (tab: PrimaryTab) => void;
  onOpenReportModal: (commitmentId: string) => void;
}

const LEVEL_COLOR: Record<string, string> = {
  Starter: '#34D399',
  Bronze: '#C9844A',
  Silver: '#A3ADB8',
  Gold: '#C9A84C',
};
const NOW = '#7D6EAE';

function LevelMark({ level }: { level: string }) {
  return <span className="inline-block h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: LEVEL_COLOR[level] || LEVEL_COLOR.Starter }} aria-hidden />;
}

function StepMark({ tone }: { tone: string }) {
  const color = tone === 'now' ? NOW : (LEVEL_COLOR[tone] || LEVEL_COLOR.Starter);
  return <span className="inline-block h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenReportModal }) => {
  const { isId } = useLanguage();
  const {
    vendor,
    commitments,
    actions,
    collectiveMetrics,
    vendorImpact,
    aiRecommendations,
    latestDeclaration,
    isLoading,
  } = useHomeData();

  if (isLoading || !vendor) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-500">{isId ? 'Memuat pusat kendali ESG...' : 'Loading ESG Command Center...'}</p>
      </div>
    );
  }

  // Active commitments
  const activeCommitments = commitments.filter(c => c.status === 'In Progress' || c.status === 'Submitted');
  const completedCount = commitments.filter(c => c.status === 'Verified').length;

  const isCodeOfEthicsSigned = latestDeclaration?.status === 'active';
  const badgeRank: Record<string, number> = {
    Starter: 1, Bronze: 2, Silver: 3, Gold: 4, Champion: 5,
  };
  const levelRank = badgeRank[vendor.esgMaturityLevel] || 1;

  const milestones = [
    {
      id: 'm0',
      title: isId ? 'Tahap 0: Kode Etik Pemasok' : 'Stage 0: Code of Ethics Passcode',
      subtitle: isCodeOfEthicsSigned
        ? (isId ? 'Sudah ditandatangani' : 'Signed & Verified')
        : (isId ? 'Wajib: tanda tangani Kode Etik' : 'Required: Sign Code of Conduct'),
      status: (isCodeOfEthicsSigned ? 'completed' : 'active') as any,
      icon: <FileCheck className="w-6 h-6" />,
      levelNumber: 0,
      onClick: () => onNavigate('declaration'),
    },
    {
      id: 'm1',
      title: isId ? 'Starter: Langkah Awal' : 'Starter: Small Wins',
      subtitle: isId ? 'Selesaikan 1 aksi ESG dasar' : 'Complete 1 basic ESG action',
      status: (!isCodeOfEthicsSigned ? 'locked' : (completedCount >= 1 || levelRank > 1 ? 'completed' : 'active')) as any,
      icon: <Sparkles className="w-6 h-6" />,
      levelNumber: 1,
      onClick: () => {
        if (!isCodeOfEthicsSigned) {
          alert(isId
            ? 'Mohon tandatangani Surat Pernyataan Kode Etik Pemasok (Tahap 0) terlebih dahulu sebagai syarat pembuka ESG Journey.'
            : 'Please sign the Supplier Code of Conduct (Stage 0) before starting the ESG journey.');
          onNavigate('declaration');
          return;
        }
        onNavigate('learn');
      },
    },
    {
      id: 'm2',
      title: isId ? 'Bronze: Partisipan Aktif' : 'Bronze: Active Participant',
      subtitle: isId ? 'Skor asesmen 36%+ → lencana Bronze' : 'Diagnostic Contributor (36%+) → Bronze badge',
      status: (!isCodeOfEthicsSigned ? 'locked' : (levelRank >= 2 ? (levelRank >= 3 ? 'completed' : 'active') : 'locked')) as any,
      icon: <Award className="w-6 h-6" />,
      levelNumber: 2,
      onClick: () => {
        if (!isCodeOfEthicsSigned) {
          onNavigate('declaration');
          return;
        }
        onNavigate('actions');
      },
    },
    {
      id: 'm3',
      title: isId ? 'Silver: Mitra Berkelanjutan' : 'Silver: Sustainable Partner',
      subtitle: isId ? 'Skor asesmen 61%+ → lencana Silver' : 'Diagnostic Practitioner (61%+) → Silver badge',
      status: (!isCodeOfEthicsSigned ? 'locked' : (levelRank >= 3 ? (levelRank >= 4 ? 'completed' : 'active') : 'locked')) as any,
      icon: <ShieldCheck className="w-6 h-6" />,
      levelNumber: 3,
      onClick: () => {
        if (!isCodeOfEthicsSigned) {
          onNavigate('declaration');
          return;
        }
        onNavigate('impact');
      },
    },
    {
      id: 'm4',
      title: isId ? 'Gold: Juara Ekosistem' : 'Gold: Ecosystem Champion',
      subtitle: isId ? 'Skor asesmen 86%+ → lencana Gold' : 'Diagnostic Leader (86%+) → Gold badge',
      status: (!isCodeOfEthicsSigned ? 'locked' : (levelRank >= 4 ? 'completed' : 'locked')) as any,
      icon: <TrendingUp className="w-6 h-6" />,
      levelNumber: 4,
      onClick: () => {
        if (!isCodeOfEthicsSigned) {
          onNavigate('declaration');
          return;
        }
        onNavigate('actions');
      },
    },
  ];

  const nextActionRecommendation = aiRecommendations.length > 0 ? aiRecommendations[0] : {
    title: 'Switch to LED Lighting Retrofit',
    reason: 'Quick win with immediate 20% energy bill reduction.',
    priority: 'High',
  };

  const name = vendor.name?.trim() || (isId ? 'mitra' : 'partner');
  const nextStep = !isCodeOfEthicsSigned
    ? { title: isId ? 'Tanda tangani kode etik' : 'Sign the code of conduct', detail: isId ? 'Ini syarat sebelum aksi lain.' : 'Required before other actions.', go: () => onNavigate('declaration'), label: isId ? 'Buka kode etik' : 'Open code' }
    : vendor.esgScore <= 0
      ? { title: isId ? 'Isi asesmen 15 soal' : 'Take the 15-question assessment', detail: isId ? 'Skor sekarang 0. Ini yang menggerakkan level.' : 'Score is 0. This moves your level.', go: () => onNavigate('assessment'), label: isId ? 'Mulai asesmen' : 'Start assessment' }
      : { title: isId ? (nextActionRecommendation.title) : nextActionRecommendation.title, detail: nextActionRecommendation.reason, go: () => onNavigate('actions'), label: isId ? 'Kerjakan aksi' : 'Do the action' };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-10 text-left">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {isId ? `Halo, ${name}` : `Hello, ${name}`}
        </h1>
        <p className="mt-3 text-6xl font-semibold tracking-tight text-emerald-400">{vendor.esgScore}<span className="text-2xl text-emerald-400">/100</span></p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{isId ? 'Skor asesmen terakhir' : 'Latest assessment score'} · {completedCount} {isId ? 'aksi terverifikasi' : 'verified actions'}</p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 text-sm">
        <div>
          <p className="text-slate-400">{isId ? 'Level' : 'Level'}</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <LevelMark level={vendor.esgMaturityLevel} />
            {vendor.esgMaturityLevel}
          </p>
          <div className="mt-3 flex gap-3 text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5"><LevelMark level="Bronze" />36</span>
            <span className="flex items-center gap-1.5"><LevelMark level="Silver" />61</span>
            <span className="flex items-center gap-1.5"><LevelMark level="Gold" />86</span>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate('impact')} className="text-left cursor-pointer">
          <p className="text-slate-400">{isId ? 'Dampak bersama' : 'Shared impact'}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            {collectiveMetrics?.totals.treesPlanted ?? 0} {isId ? 'pohon' : 'trees'}
          </p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            {collectiveMetrics?.totals.energySavedKwh ?? 0} kWh · {collectiveMetrics?.totals.wasteRecycledKg ?? 0} kg · {collectiveMetrics?.totals.peopleBenefited ?? 0} {isId ? 'orang' : 'people'}
          </p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            {isId ? 'Dampak kamu' : 'Your impact'}: {vendorImpact?.treesPlanted ?? 0} {isId ? 'pohon' : 'trees'} · {vendorImpact?.energySavedKwh ?? 0} kWh
          </p>
        </button>
      </section>

      <button
        type="button"
        onClick={nextStep.go}
        className={`w-full rounded-3xl px-6 py-5 text-left cursor-pointer ${vendor.esgMaturityLevel === 'Bronze' ? 'text-white' : 'text-slate-900'}`}
        style={{ background: LEVEL_COLOR[vendor.esgMaturityLevel] || LEVEL_COLOR.Starter }}
      >
        <p className="text-sm opacity-80">{isId ? 'Lakukan ini dulu' : 'Do this next'}</p>
        <p className="mt-1 text-xl font-semibold">{nextStep.title}</p>
        <p className="mt-1 text-sm opacity-90">{nextStep.detail}</p>
        <p className="mt-3 text-sm font-semibold">{nextStep.label} →</p>
      </button>

      <section>
        <h2 className="text-lg font-semibold">{isId ? 'Perjalanan' : 'Journey'}</h2>
        <ol className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
          {milestones.map(m => (
            <li key={m.id}>
              <button type="button" onClick={m.onClick} className="flex w-full items-center justify-between gap-3 py-3 text-left cursor-pointer">
                <span className="flex items-center gap-3">
                  <StepMark tone={m.id === 'm1' ? 'now' : m.id === 'm2' ? 'Bronze' : m.id === 'm3' ? 'Silver' : m.id === 'm4' ? 'Gold' : 'Starter'} />
                  <span>
                    <span className="block font-medium">{m.title}</span>
                    <span className="block text-sm text-slate-500">{m.subtitle}</span>
                  </span>
                </span>
                <span
                  className="text-xs uppercase text-slate-400"
                  style={m.id === 'm1' ? { color: NOW } : m.status === 'completed' ? { color: LEVEL_COLOR.Starter } : undefined}
                >{m.status === 'completed' ? (isId ? 'Selesai' : 'Done') : m.status === 'active' ? (isId ? 'Sekarang' : 'Now') : (isId ? 'Nanti' : 'Later')}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isId ? `Sedang dikerjakan (${activeCommitments.length})` : `In progress (${activeCommitments.length})`}</h2>
          <button type="button" onClick={() => onNavigate('actions')} className="text-sm font-semibold text-emerald-400 cursor-pointer">{isId ? 'Semua aksi' : 'All actions'}</button>
        </div>
        {activeCommitments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{isId ? 'Belum ada. Pilih satu aksi kalau asesmen dan kode etik sudah beres.' : 'None yet. Pick an action after the code and assessment.'}</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
            {activeCommitments.map(cmt => {
              const action = actions.find(a => a.id === cmt.actionId);
              if (!action) return null;
              return (
                <li key={cmt.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="font-medium">{isId ? (action.titleId || action.title) : action.title}</span>
                  <button type="button" onClick={() => onOpenReportModal(cmt.id)} className="shrink-0 text-sm font-semibold text-emerald-400 cursor-pointer">
                    {cmt.status === 'Submitted' ? (isId ? 'Perbarui bukti' : 'Update proof') : (isId ? 'Unggah bukti' : 'Upload proof')}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

    </div>
  );

};
