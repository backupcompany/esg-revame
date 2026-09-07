import React, { useState, useEffect } from 'react';
import { AssessmentAnswerOption, AssessmentQuestion, AssessmentResult, RecommendedActionItem, RecommendedModuleItem } from '../types';
import { assessmentService } from '../services/assessmentService';
import { PrimaryTab } from '../../../core/types';
import { useLanguage } from '../../../core/context/LanguageContext';
import {
  Leaf,
  Users,
  ShieldCheck,
  Info,
  ChevronDown,
  ArrowRight,
  Download,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Award,
  Zap,
  Recycle,
  Shield,
  Heart,
  HelpCircle,
  Flag,
  FileText,
  BookOpen,
  TrendingUp,
  History
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AssessmentViewProps {
  onNavigate: (tab: PrimaryTab) => void;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({ onNavigate }) => {
  const { lang, isId } = useLanguage();
  const [answers, setAnswers] = useState<Record<string, AssessmentAnswerOption>>({});
  const [expandedWhy, setExpandedWhy] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [bankReady, setBankReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [saved, bank] = await Promise.all([
        assessmentService.getSavedResult(),
        assessmentService.loadBank()
      ]);
      if (cancelled) return;
      setQuestions(bank);
      setBankReady(true);
      if (saved) {
        setResult(saved);
        if (saved.answers) {
          setAnswers(saved.answers);
        }
      }
      setHistory(await assessmentService.getAssessmentHistory());
    })();
    return () => { cancelled = true; };
  }, []);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQuestions
    ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100))
    : 0;

  const handleOptionSelect = (questionId: string, option: AssessmentAnswerOption) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const toggleWhy = (questionId: string) => {
    setExpandedWhy(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const calculated = await assessmentService.saveResult(answers);
      if (!calculated) return;
      setResult(calculated);
      setHistory(await assessmentService.getAssessmentHistory());

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setResult(null);
    setAnswers({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadReport = () => {
    if (!result) return;
    const reportText = `================================================
ECOPARTNER - ESG STARTER ASSESSMENT REPORT
================================================
Date: ${new Date(result.completedAt).toLocaleDateString()}
Maturity Level: ${result.maturityLevel}
Overall Maturity Score: ${result.overallPercentage}%
Assessment Iteration #: ${result.assessmentCount || 1}

PILLAR PERFORMANCE BREAKDOWN:
- Environmental (E): ${result.pillarResults.E.percentage}% (${result.pillarResults.E.earnedPoints}/${result.pillarResults.E.maxPoints} pts)
- Social (S):        ${result.pillarResults.S.percentage}% (${result.pillarResults.S.earnedPoints}/${result.pillarResults.S.maxPoints} pts)
- Governance (G):    ${result.pillarResults.G.percentage}% (${result.pillarResults.G.earnedPoints}/${result.pillarResults.G.maxPoints} pts)

RECOMMENDED ACTIONS TO CLOSE GAPS:
${result.recommendedActions.map((rec, i) => `${i + 1}. [${rec.pillar}] ${isId && rec.titleId ? rec.titleId : rec.title}\n   ${isId && rec.descriptionId ? rec.descriptionId : rec.description}`).join('\n\n')}

RECOMMENDED LEARNING MODULES:
${(result.recommendedModules || []).map((mod, i) => `${i + 1}. ${isId && mod.titleId ? mod.titleId : mod.title} (${mod.durationMinutes} mins)`).join('\n')}

------------------------------------------------
Note: This score is a diagnostic guide for operational improvement and does not constitute a formal ESG audit.
================================================`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ESG_Starter_Assessment_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scrollToRecommendedActions = () => {
    const el = document.getElementById('recommended-actions-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate('actions');
    }
  };

  const renderIconForRecommendation = (iconName: string) => {
    switch (iconName) {
      case 'solar_power':
      case 'zap':
        return <Zap className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />;
      case 'recycling':
      case 'leaf':
        return <Recycle className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />;
      case 'shield':
      case 'shield_alert':
        return <Shield className="w-6 h-6 text-amber-700 dark:text-amber-300" />;
      case 'heart':
      case 'volunteer_activism':
        return <Heart className="w-6 h-6 text-indigo-700 dark:text-indigo-300" />;
      case 'handshake':
      case 'file_text':
      default:
        return <FileText className="w-6 h-6 text-teal-700 dark:text-teal-300" />;
    }
  };

  // Group questions by pillar
  const envQuestions = questions.filter(q => q.pillar === 'E');
  const socQuestions = questions.filter(q => q.pillar === 'S');
  const govQuestions = questions.filter(q => q.pillar === 'G');

  // ================= RESULTS VIEW =================
  if (result) {
    const previousScore = result.previousResult?.overallPercentage;
    const scoreDiff = previousScore !== undefined ? result.overallPercentage - previousScore : null;

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10 text-left animate-fade-in">
        {/* Header & Maturity Level Glassmorphic Card */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {isId ? 'Hasil Diagnostik Asesmen Selesai' : 'Diagnostic Assessment Complete'}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {isId ? 'Hasil Asesmen & Rekomendasi Pertumbuhan ESG' : 'Assessment Results & Growth Roadmap'}
          </h1>

          {/* Maturity Level Box */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden max-w-3xl mx-auto">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
                {isId ? 'Level Kematangan ESG Saat Ini' : 'Current Maturity Level'}
              </h2>
              {result.assessmentCount && result.assessmentCount > 1 && (
                <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">
                  {isId ? `Re-Asesmen #${result.assessmentCount}` : `Assessment #${result.assessmentCount}`}
                </span>
              )}
            </div>

            <div className="text-3xl sm:text-5xl font-black text-[#0f5238] dark:text-emerald-400 mb-3 flex items-center justify-center gap-3">
              <Award className="w-10 h-10 sm:w-14 sm:h-14 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{result.maturityLevel} {isId ? 'Level' : 'Level'}</span>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{result.overallPercentage}%</span>
              <span className="text-xs text-slate-500">{isId ? 'Skor Total Keseluruhan' : 'Overall Score'}</span>
              {scoreDiff !== null && scoreDiff !== 0 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${scoreDiff > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  <TrendingUp className="w-3 h-3" />
                  {scoreDiff > 0 ? `+${scoreDiff}%` : `${scoreDiff}%`} {isId ? 'dari sebelumnya' : 'vs prev'}
                </span>
              )}
            </div>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
              {isId
                ? 'Skor ini adalah panduan diagnostik kematangan ESG Anda dan merekomendasikan materi pembelajaran serta aksi nyata untuk meningkatkan daya saing.'
                : 'This score is a guide to your current ESG maturity and identifies where you can make the most impact. It is not a formal certification.'}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap gap-4 justify-center pt-2">
            <button
              type="button"
              onClick={scrollToRecommendedActions}
              className="bg-[#0f5238] hover:bg-[#0f5238]/90 text-white font-bold text-sm px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isId ? 'Lihat Rekomendasi Aksi & Belajar' : 'See Recommended Actions & Learn'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDownloadReport}
              className="bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-[#0f5238] dark:text-emerald-300 font-bold text-sm px-6 py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-emerald-300/50 dark:border-emerald-800"
            >
              <Download className="w-4 h-4" />
              <span>{isId ? 'Unduh Laporan Ringkas' : 'Download Summary Report'}</span>
            </button>

            <button
              type="button"
              onClick={handleRetake}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm px-5 py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isId ? 'Lakukan Re-Asesmen Berkala' : 'Take Periodic Re-Assessment'}</span>
            </button>
          </div>
        </section>

        {/* Pillar Breakdown Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#0f5238] dark:text-emerald-400" />{' '}
              {isId ? 'Performa Berdasarkan Pilar ESG' : 'Performance by Pillar'}
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {isId ? 'Skor Keseluruhan' : 'Overall Score'}: {result.overallPercentage}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Environmental */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border-t-4 border-[#0f5238] border-x border-b border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-[#0f5238] dark:text-emerald-300 flex items-center justify-center">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {isId ? result.pillarResults.E.titleId : result.pillarResults.E.title}
                  </h3>
                </div>

                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-500">{isId ? 'Tingkat Kematangan' : 'Maturity Score'}</span>
                  <span className="text-[#0f5238] dark:text-emerald-400">{result.pillarResults.E.percentage}%</span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative">
                  <div
                    className="bg-[#0f5238] dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${result.pillarResults.E.percentage}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-4">
                {result.pillarResults.E.earnedPoints} / {result.pillarResults.E.maxPoints} pts
              </p>
            </div>

            {/* Social */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border-t-4 border-[#8e4e14] border-x border-b border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-[#8e4e14] dark:text-amber-300 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {isId ? result.pillarResults.S.titleId : result.pillarResults.S.title}
                  </h3>
                </div>

                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-500">{isId ? 'Tingkat Kematangan' : 'Maturity Score'}</span>
                  <span className="text-[#8e4e14] dark:text-amber-400">{result.pillarResults.S.percentage}%</span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative">
                  <div
                    className="bg-[#8e4e14] dark:bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${result.pillarResults.S.percentage}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-4">
                {result.pillarResults.S.earnedPoints} / {result.pillarResults.S.maxPoints} pts
              </p>
            </div>

            {/* Governance */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border-t-4 border-indigo-600 border-x border-b border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {isId ? result.pillarResults.G.titleId : result.pillarResults.G.title}
                  </h3>
                </div>

                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-500">{isId ? 'Tingkat Kematangan' : 'Maturity Score'}</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{result.pillarResults.G.percentage}%</span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${result.pillarResults.G.percentage}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-4">
                {result.pillarResults.G.earnedPoints} / {result.pillarResults.G.maxPoints} pts
              </p>
            </div>
          </div>
        </section>

        {/* Recommended Modules (Learning) Section */}
        {result.recommendedModules && result.recommendedModules.length > 0 && (
          <section className="space-y-6 pt-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[#0f5238] dark:text-emerald-400" />
                {isId ? 'Modul Pelatihan Pembelajaran Direkomendasikan' : 'Recommended Learning Modules'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isId
                  ? 'Berdasarkan jawaban asesmen Anda, pelajari modul berikut di menu Learn untuk memperkuat pemahaman tim.'
                  : 'Based on your assessment gaps, study these modules in the Learn section to upskill your team.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {result.recommendedModules.map((mod, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-[11px] font-bold">
                        {isId ? `Modul ${mod.pillar}` : `Pillar ${mod.pillar}`}
                      </span>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        ⏱️ {mod.durationMinutes} mins
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {isId && mod.titleId ? mod.titleId : mod.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {isId && mod.reasonId ? mod.reasonId : mod.reason}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate('learn')}
                    className="mt-6 text-[#0f5238] dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 hover:gap-2.5 transition-all cursor-pointer"
                  >
                    <span>{isId ? 'Mulai Belajar' : 'Start Learning'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommended Actions Section */}
        <section id="recommended-actions-section" className="space-y-6 pt-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-600" />
              {isId ? 'Aksi Nyata yang Direkomendasikan' : 'Recommended Actions'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isId
                ? 'Ambil aksi di katalog Actions untuk menutup gap kepatuhan dan meraih poin ESG tambahan.'
                : 'Based on your assessment, here are practical steps you can take to improve your ESG maturity.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.recommendedActions.map((rec, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-200"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {renderIconForRecommendation(rec.iconName)}
                    </div>
                    <div>
                      <span className="inline-block px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[11px] font-bold mb-1 uppercase tracking-wider">
                        {isId ? `Pilar ${rec.pillar} • ${rec.categoryId || rec.category}` : `Pillar ${rec.pillar} • ${rec.category}`}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {isId && rec.titleId ? rec.titleId : rec.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    {isId && rec.descriptionId ? rec.descriptionId : rec.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {isId && rec.impactLabelId ? rec.impactLabelId : rec.impactLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('actions')}
                    className="text-[#0f5238] dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 hover:gap-2.5 transition-all cursor-pointer"
                  >
                    <span>{isId && rec.ctaTextId ? rec.ctaTextId : rec.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Assessment History / Re-assessment Timeline */}
        {history.length > 1 && (
          <section className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              {isId ? 'Riwayat Re-Asesmen & Perkembangan' : 'Re-Assessment History & Growth'}
            </h3>
            <div className="space-y-3">
              {history.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 font-bold flex items-center justify-center">
                      #{history.length - i}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {new Date(item.completedAt).toLocaleDateString()} — {item.maturityLevel} Level
                      </p>
                      <p className="text-slate-400">{item.totalEarnedPoints} pts</p>
                    </div>
                  </div>
                  <span className="font-black text-sm text-[#0f5238] dark:text-emerald-400">{item.overallPercentage}%</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // ================= QUESTIONNAIRE VIEW =================
  if (!bankReady) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-sm text-slate-500">
        {isId ? 'Memuat pertanyaan dari server…' : 'Loading questions…'}
      </div>
    );
  }
  if (!totalQuestions) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-sm text-slate-500">
        {isId ? 'Bank pertanyaan tidak tersedia. Pastikan API berjalan.' : 'Question bank unavailable. Is the API running?'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8 text-left animate-fade-in">
      {/* Header & Intro Section */}
      <section className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {isId ? 'ESG Starter Assessment (Diagnostik Rekanan)' : 'ESG Starter Assessment'}
        </h1>

        {/* Diagnostic Banner */}
        <div className="bg-white dark:bg-slate-900 shadow-md rounded-3xl p-5 sm:p-6 border-2 border-emerald-500/20 flex items-start gap-4">
          <div className="bg-emerald-100 dark:bg-emerald-950 text-[#0f5238] dark:text-emerald-300 rounded-full p-2.5 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
              {isId
                ? 'Asesmen mandiri ini alat diagnostik operasional — bukan sertifikasi ESG formal dan tidak masuk skor tender Siloam sampai ada kontrak data dengan procurement. Hasilnya: rekomendasi modul belajar dan aksi praktis.'
                : 'This self-assessment is an operational diagnostic — not a formal ESG certification and not a Siloam tender score until procurement signs a data contract. It recommends learning modules and practical actions.'}
            </p>
          </div>
        </div>
      </section>

      {/* Progress Sticky Bar */}
      <div className="sticky top-16 z-30 bg-[#f8f9fa]/95 dark:bg-slate-950/95 backdrop-blur-md py-3 space-y-2 border-b border-slate-200/50 dark:border-slate-800">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-slate-500 uppercase tracking-wider">
            {isId ? 'Progres Asesmen' : 'Assessment Progress'}
          </span>
          <span className="text-[#0f5238] dark:text-emerald-400">
            {answeredCount} {isId ? 'dari' : 'of'} {totalQuestions} {isId ? 'Terjawab' : 'Answered'}
          </span>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-[#0f5238] dark:bg-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Questionnaire Form */}
      <form onSubmit={handleSubmit} className="space-y-12 pb-16">
        {/* ENVIRONMENTAL PILLAR */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b-2 border-[#0f5238] pb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-[#0f5238] dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
              <Leaf className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isId ? 'Pilar Lingkungan / Environmental (5 Pertanyaan)' : 'Environmental (5 Questions)'}
            </h2>
          </div>

          <div className="space-y-6">
            {envQuestions.map(q => renderQuestionCard(q))}
          </div>
        </section>

        {/* SOCIAL PILLAR */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b-2 border-[#8e4e14] pb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-[#8e4e14] dark:text-amber-300 flex items-center justify-center font-bold text-sm">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isId ? 'Pilar Sosial & K3 / Social (5 Pertanyaan)' : 'Social (5 Questions)'}
            </h2>
          </div>

          <div className="space-y-6">
            {socQuestions.map(q => renderQuestionCard(q))}
          </div>
        </section>

        {/* GOVERNANCE PILLAR */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b-2 border-indigo-600 pb-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isId ? 'Pilar Tata Kelola / Governance (5 Pertanyaan)' : 'Governance (5 Questions)'}
            </h2>
          </div>

          <div className="space-y-6">
            {govQuestions.map(q => renderQuestionCard(q))}
          </div>
        </section>

        {/* Submit Section */}
        <section className="flex flex-col items-center pt-6">
          <button
            type="submit"
            disabled={isSubmitting || answeredCount === 0}
            className="bg-[#0f5238] hover:bg-[#0f5238]/90 text-white font-bold text-base px-10 py-4 rounded-full min-h-[52px] shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 cursor-pointer"
          >
            <span>{isId ? 'Hitung Hasil Diagnostik' : 'Calculate Diagnostic Results'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          {answeredCount < totalQuestions && (
            <p className="text-xs text-slate-500 mt-2">
              {isId
                ? `Anda dapat mengirim sekarang (${answeredCount}/${totalQuestions} terjawab) atau lengkapi semua untuk hasil terbaik.`
                : `You can submit now (${answeredCount}/${totalQuestions} answered) or complete all questions for maximum accuracy.`}
            </p>
          )}
        </section>
      </form>
    </div>
  );

  // Helper render for single question card
  function renderQuestionCard(q: AssessmentQuestion) {
    const currentVal = answers[q.id];
    const isExpanded = expandedWhy[q.id];
    const qText = isId && q.questionTextId ? q.questionTextId : q.questionText;
    const whyText = isId && q.whyWeAskId ? q.whyWeAskId : q.whyWeAsk;

    return (
      <div
        key={q.id}
        className="bg-white dark:bg-slate-900 shadow-sm rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 hover:border-slate-300 transition-all"
      >
        <div className="space-y-2">
          <p className="text-base font-bold text-slate-900 dark:text-slate-100">
            {q.questionNumber}. {qText}
          </p>

          {/* Expandable "Why we ask" Accordion */}
          <div>
            <button
              type="button"
              onClick={() => toggleWhy(q.id)}
              className="text-[#0f5238] dark:text-emerald-400 font-semibold text-xs flex items-center gap-1 hover:underline cursor-pointer"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              <span>{isId ? 'Mengapa kami menanyakan ini?' : 'Why we ask'}</span>
            </button>

            {isExpanded && (
              <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 italic border border-slate-200/50 dark:border-slate-700/50 animate-fade-in">
                {whyText}
              </div>
            )}
          </div>
        </div>

        {/* Answer Options Radio Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: isId ? 'Sudah (Yes)' : 'Yes', value: 'yes' as const },
            { label: isId ? 'Sebagian (Partially)' : 'Partially', value: 'partially' as const },
            { label: isId ? 'Belum (Not Yet)' : 'Not Yet', value: 'not_yet' as const },
            { label: isId ? 'Tidak Relevan (N/A)' : 'Not Applicable', value: 'na' as const }
          ].map(opt => {
            const isSelected = currentVal === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleOptionSelect(q.id, opt.value)}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'border-[#0f5238] bg-emerald-50 dark:bg-emerald-950/60 text-[#0f5238] dark:text-emerald-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#0f5238] dark:text-emerald-400 shrink-0" />}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
};
