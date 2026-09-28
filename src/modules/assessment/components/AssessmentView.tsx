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

function previewScore(questions: AssessmentQuestion[], answers: Record<string, AssessmentAnswerOption>) {
  const pts = { yes: 10, partially: 5, not_yet: 0 } as const;
  const pillars = { E: { e: 0, m: 0 }, S: { e: 0, m: 0 }, G: { e: 0, m: 0 } };
  let earned = 0;
  let max = 0;
  for (const q of questions) {
    const a = answers[q.id];
    if (a !== 'yes' && a !== 'partially' && a !== 'not_yet') continue;
    const bucket = pillars[q.pillar];
    if (!bucket) continue;
    bucket.e += pts[a];
    bucket.m += 10;
    earned += pts[a];
    max += 10;
  }
  return { pct: max ? Math.round((earned / max) * 100) : 0, earned, max, pillars };
}

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
  const [cursor, setCursor] = useState(0);
  const [shownScore, setShownScore] = useState(0);
  const [scoreRun, setScoreRun] = useState(0);
  const [scoreError, setScoreError] = useState('');
  const draftChain = React.useRef(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [saved, bank, draft] = await Promise.all([
        assessmentService.getSavedResult(),
        assessmentService.loadBank(),
        assessmentService.getDraft()
      ]);
      if (cancelled) return;
      setQuestions(bank);
      setBankReady(true);
      if (saved) {
        setResult(saved);
        if (saved.answers) setAnswers(saved.answers);
        setShownScore(saved.overallPercentage);
        setScoreRun(1);
      } else if (draft && Object.keys(draft).length) {
        setAnswers(draft);
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
    if (scoreRun > 0) return;
    setAnswers(prev => {
      const next = { ...prev, [questionId]: option };
      const idx = questions.findIndex(q => q.id === questionId);
      const rest = questions.findIndex((q, i) => i > idx && !next[q.id]);
      if (rest >= 0) setCursor(rest);
      draftChain.current = draftChain.current.then(() => assessmentService.saveDraft(next)).then(() => undefined);
      return next;
    });
  };

  const toggleWhy = (questionId: string) => {
    setExpandedWhy(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scoreRun > 0) return;
    setIsSubmitting(true);

    try {
      const calculated = await assessmentService.saveResult(answers);
      if (!calculated) {
        setScoreError(isId ? 'Server belum menyimpan. Coba Hitung hasil lagi.' : 'The server did not save it. Calculate again.');
        return;
      }
      setScoreRun(n => n + 1);
      setScoreError('');
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

  useEffect(() => {
    if (!scoreRun) return;
    const { pct } = previewScore(questions, answers);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setShownScore(Math.round(pct * t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    setShownScore(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scoreRun]);

  // ================= RESULTS VIEW =================
  if (result && scoreRun === 0) {
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
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800 text-xs">
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

  const locked = scoreRun > 0;
  const active = questions[Math.min(cursor, questions.length - 1)];
  const pillarName = (p: string) =>
    p === 'E' ? (isId ? 'Lingkungan' : 'Environment')
    : p === 'S' ? (isId ? 'Sosial' : 'Social')
    : (isId ? 'Tata kelola' : 'Governance');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-left">
      <h1 className="text-2xl font-semibold tracking-tight">{isId ? 'Asesmen singkat' : 'Starter assessment'}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {answeredCount}/{totalQuestions} {isId ? 'terjawab' : 'answered'}
        {' · '}
        {isId ? 'Bukan sertifikasi. Hasilnya rekomendasi belajar dan aksi.' : 'A diagnostic, not a certification. It recommends learning and actions.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 grid items-start gap-12 lg:grid-cols-[minmax(0,1.4fr)_220px]">
        <div>
          <div className="space-y-3">
            {(['E', 'S', 'G'] as const).map(pillar => (
              <div key={pillar} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-slate-400">{pillarName(pillar)}</span>
                <div className="flex gap-1">
                  {questions.map((q, i) => q.pillar === pillar && (
                    <button
                      key={q.id}
                      type="button"
                      disabled={locked}
                      onClick={() => setCursor(i)}
                      className={`h-9 w-9 rounded-full text-sm font-semibold disabled:cursor-default ${
                        q.id === active.id ? 'bg-emerald-600 text-white' : answers[q.id] ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500'
                      }`}
                    >
                      {q.questionNumber}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">{renderQuestionCard(active)}</div>
          <div className="mt-8 flex gap-3">
            <button type="button" disabled={locked || cursor === 0} onClick={() => setCursor(i => Math.max(0, i - 1))} className="rounded-full bg-slate-800 px-5 py-2.5 text-sm text-slate-100 disabled:opacity-30 cursor-pointer">
              {isId ? 'Sebelumnya' : 'Previous'}
            </button>
            <button type="button" disabled={locked || cursor >= questions.length - 1} onClick={() => setCursor(i => Math.min(questions.length - 1, i + 1))} className="rounded-full bg-slate-800 px-5 py-2.5 text-sm text-slate-100 disabled:opacity-30 cursor-pointer">
              {isId ? 'Berikutnya' : 'Next'}
            </button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <p className="text-sm text-slate-400">{isId ? 'Skor' : 'Score'}</p>
          <p className="mt-1 text-6xl font-semibold tabular-nums leading-none text-emerald-500">{locked ? shownScore : 0}</p>
          <p className="mt-1 text-sm text-emerald-500">/ 100</p>
          <button
            type="submit"
            disabled={locked || isSubmitting || answeredCount < totalQuestions}
            className={`mt-6 rounded-full px-5 py-2.5 text-sm font-medium cursor-pointer ${
              locked || answeredCount < totalQuestions
                ? 'bg-slate-800 text-slate-500 cursor-default'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {locked ? (isId ? 'Sudah dihitung' : 'Calculated') : isSubmitting ? (isId ? 'Menghitung…' : 'Calculating…') : (isId ? 'Hitung hasil' : 'Calculate')}
          </button>
          {scoreError && <p className="mt-3 text-xs text-amber-300">{scoreError}</p>}
          {locked && (
            <ul className="mt-6 space-y-1 text-sm text-slate-700 dark:text-slate-200">
              {(['E', 'S', 'G'] as const).map(key => {
                const row = previewScore(questions, answers).pillars[key];
                const pct = row.m ? Math.round((row.e / row.m) * 100) : 0;
                return <li key={key}>{pillarName(key)} {pct}</li>;
              })}
            </ul>
          )}
        </aside>
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
      <div key={q.id} className="space-y-4">
        <div className="space-y-2">
          <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
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
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{whyText}</p>
            )}
          </div>
        </div>

        {/* Answer Options Radio Grid */}
        <div className="grid gap-2">
          {[
            { letter: 'A', label: isId ? 'Sudah' : 'Yes', value: 'yes' as const },
            { letter: 'B', label: isId ? 'Sebagian' : 'Partially', value: 'partially' as const },
            { letter: 'C', label: isId ? 'Belum' : 'Not yet', value: 'not_yet' as const },
            { letter: 'D', label: isId ? 'Tidak relevan' : 'Not applicable', value: 'na' as const }
          ].map(opt => {
            const isSelected = currentVal === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={locked}
                onClick={() => handleOptionSelect(q.id, opt.value)}
                className={`flex items-center gap-3 py-2 text-left text-sm disabled:cursor-default cursor-pointer ${
                  isSelected ? 'font-semibold text-emerald-600 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {opt.letter}
                </span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
};
