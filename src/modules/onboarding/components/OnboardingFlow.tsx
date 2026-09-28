import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../../core/context/LanguageContext';
import { OnboardingStep, OnboardingFormState, FAMILIARITY_OPTIONS, OBJECTIVE_OPTIONS } from '../types';
import { onboardingService } from '../services/onboardingService';
import { PrimaryTab } from '../../../core/types';
import {
  Leaf,
  ArrowRight,
  ArrowLeft,
  Building2,
  User,
  Search,
  CheckCircle2,
  GitFork,
  BookOpen,
  Heart,
  Users,
  Scale,
  Handshake,
  GraduationCap,
  FileText,
  CheckCircle,
  Rocket,
  Sparkles
} from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: (targetTab?: PrimaryTab) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { isId } = useLanguage();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<OnboardingFormState>({
    companyName: '',
    industry: '',
    companySize: '',
    employeeCount: '',
    location: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    esgFamiliarity: '',
    esgObjectives: ['env_impact', 'employee_wellbeing']
  });

  useEffect(() => {
    onboardingService.getInitialFormData().then(data => {
      setFormData(data);
    });
  }, []);

  const handleNextStep = () => {
    if (step < 5) {
      setStep((step + 1) as OnboardingStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((step - 1) as OnboardingStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCompleteOnboarding = async (targetTab: PrimaryTab = 'assessment') => {
    setIsSaving(true);
    try {
      await onboardingService.saveOnboardingData(formData);
      onComplete(targetTab);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleObjective = (id: string) => {
    const current = formData.esgObjectives;
    if (current.includes(id)) {
      setFormData({ ...formData, esgObjectives: current.filter(item => item !== id) });
    } else {
      setFormData({ ...formData, esgObjectives: [...current, id] });
    }
  };

  const renderIconForFamiliarity = (iconName: string) => {
    switch (iconName) {
      case 'Search':
        return <Search className="w-6 h-6 text-[#0f5238] dark:text-emerald-300" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-6 h-6 text-[#0f5238] dark:text-emerald-300" />;
      case 'GitFork':
        return <GitFork className="w-6 h-6 text-[#0f5238] dark:text-emerald-300" />;
      case 'BookOpen':
        return <BookOpen className="w-6 h-6 text-[#0f5238] dark:text-emerald-300" />;
      default:
        return <CheckCircle2 className="w-6 h-6 text-[#0f5238] dark:text-emerald-300" />;
    }
  };

  const renderIconForObjective = (iconName: string) => {
    switch (iconName) {
      case 'Leaf':
        return <Leaf className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />;
      case 'Heart':
        return <Heart className="w-5 h-5 text-amber-700 dark:text-amber-300" />;
      case 'Users':
        return <Users className="w-5 h-5 text-indigo-700 dark:text-indigo-300" />;
      case 'Scale':
        return <Scale className="w-5 h-5 text-blue-700 dark:text-blue-300" />;
      case 'Handshake':
        return <Handshake className="w-5 h-5 text-teal-700 dark:text-teal-300" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-purple-700 dark:text-purple-300" />;
      case 'FileText':
        return <FileText className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />;
      default:
        return <Leaf className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-300 bg-slate-200/95 dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button type="button" onClick={handlePrevStep} className="cursor-pointer text-sm font-semibold text-slate-600 dark:text-slate-300">
                Back
              </button>
            )}
            <span className="font-semibold">ESG Together</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {step < 5 && <span className="text-slate-500">{step} / 4</span>}
            {step < 5 && (
              <button type="button" onClick={() => onComplete('home')} className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">
                {isId ? 'Lewati' : 'Skip'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 max-w-3xl mx-auto w-full">
        {/* ================= STEP 1: WELCOME ================= */}
        {step === 1 && (
          <div className="w-full max-w-xl text-left">
            <h1 className="text-3xl font-semibold tracking-tight">Start here</h1>
            <p className="mt-3 text-lg italic text-slate-600 dark:text-slate-300">
              Three short steps: your company, how far along you are, then what you want to work on. About three minutes.
            </p>
            <button
              type="button"
              onClick={handleNextStep}
              className="mt-8 cursor-pointer rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white"
            >
              Continue
            </button>
          </div>
        )}

        {/* ================= STEP 2: COMPANY INFORMATION ================= */}
        {step === 2 && (
          <div className="w-full max-w-3xl space-y-6 animate-fade-in">
            {/* Progress Bar Header */}
            <div className="mb-4">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Company Information</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Step 2 of 4: Basic organization and contact details
                  </p>
                </div>
                <div className="text-xs font-bold text-[#0f5238] dark:text-emerald-400">2 of 4</div>
              </div>
              <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                <div className="absolute top-0 left-0 h-full bg-[#0f5238] dark:bg-emerald-500 rounded-full transition-all duration-300" style={{ width: '50%' }} />
              </div>
            </div>

            {/* Form Container */}
            <div className="space-y-6">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleNextStep();
                }}
                className="space-y-6"
              >
                {/* Organization Details */}
                <div className="space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#0f5238] dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Company Details
                  </h2>

                  {/* Company Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="e.g. Acme Logistics & Supply Co."
                      className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f5238] focus:ring-2 focus:ring-[#0f5238]/20 transition-all"
                    />
                  </div>

                  {/* Industry & Company Size */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Industry *
                      </label>
                      <select
                        required
                        value={formData.industry}
                        onChange={e => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f5238] transition-all"
                      >
                        <option value="" disabled>Select Industry</option>
                        <option value="Agriculture & Farming">Agriculture & Farming</option>
                        <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                        <option value="Retail & Consumer Goods">Retail & Consumer Goods</option>
                        <option value="Professional & Business Services">Professional & Business Services</option>
                        <option value="Technology & IT">Technology & IT</option>
                        <option value="Freight, Logistics & Warehousing">Freight, Logistics & Warehousing</option>
                        <option value="Food & Hospitality">Food & Hospitality</option>
                        <option value="Construction & Real Estate">Construction & Real Estate</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Company Size *
                      </label>
                      <select
                        required
                        value={formData.companySize}
                        onChange={e => setFormData({ ...formData, companySize: e.target.value })}
                        className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f5238] transition-all"
                      >
                        <option value="" disabled>Select Size</option>
                        <option value="Micro (1-9 employees)">Micro (1-9 employees)</option>
                        <option value="Small (10-49 employees)">Small (10-49 employees)</option>
                        <option value="Medium (50-249 employees)">Medium (50-249 employees)</option>
                        <option value="Large (250+ employees)">Large (250+ employees)</option>
                      </select>
                    </div>
                  </div>

                  {/* Number of Employees & Main Operating Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Number of Employees *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 25 employees"
                        value={formData.employeeCount}
                        onChange={e => setFormData({ ...formData, employeeCount: e.target.value })}
                        className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f5238] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Main Operating Location *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="City / Country"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f5238] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Contact Person */}
                <div className="space-y-4 pt-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#0f5238] dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <User className="w-4 h-4" /> Primary Contact Person
                  </h2>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contactName}
                      onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="Full Name (e.g. Jane Doe)"
                      className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f5238] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.contactEmail}
                        onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="name@company.com"
                        className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f5238] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.contactPhone}
                        onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f5238] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Navigation Actions */}
                <div className="pt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-5 h-11 rounded-full font-semibold text-xs text-[#0f5238] dark:text-emerald-300 bg-[#0f5238]/10 hover:bg-[#0f5238]/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>

                  <button
                    type="submit"
                    className="px-8 h-11 rounded-full font-bold text-xs text-white bg-[#0f5238] hover:bg-[#0f5238]/90 transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= STEP 3: ESG FAMILIARITY ================= */}
        {step === 3 && (
          <div className="w-full max-w-3xl space-y-6 animate-fade-in">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0f5238] dark:text-emerald-400">
                  Step 3 of 4
                </span>
                <span className="text-xs font-semibold text-slate-500">3 of 4</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#0f5238] dark:bg-emerald-500 rounded-full transition-all duration-300" style={{ width: '75%' }} />
              </div>
            </div>

            {/* Question Header */}
            <div className="text-center sm:text-left space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                How familiar is your company with ESG?
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Select the statement that best describes your organization's current position.
              </p>
            </div>

            {/* Options List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FAMILIARITY_OPTIONS.map(opt => {
                const isSelected = formData.esgFamiliarity === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, esgFamiliarity: opt.id })}
                    className={`cursor-pointer border-b py-4 text-left ${
                      isSelected ? 'border-emerald-500' : 'border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    <div className={`mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                    }`}>
                      {renderIconForFamiliarity(opt.icon)}
                    </div>
                    <div>
                      <h3 className={`mb-1 text-base font-bold ${isSelected ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-100'}`}>
                        {opt.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 h-11 rounded-full font-semibold text-xs text-[#0f5238] dark:text-emerald-300 bg-[#0f5238]/10 hover:bg-[#0f5238]/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                disabled={!formData.esgFamiliarity}
                onClick={handleNextStep}
                className="px-8 h-11 rounded-full font-bold text-xs text-white bg-[#0f5238] hover:bg-[#0f5238]/90 disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: ESG OBJECTIVES ================= */}
        {step === 4 && (
          <div className="w-full max-w-3xl space-y-6 animate-fade-in">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-[#0f5238] dark:text-emerald-400">Step 4 of 4</span>
                <span className="text-xs font-semibold text-slate-500">4 of 4</span>
              </div>
              <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                <div className="h-full bg-[#0f5238] dark:bg-emerald-500 rounded-full w-full" />
              </div>
            </div>

            {/* Question Header */}
            <div className="text-center sm:text-left space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                What are your primary ESG objectives?
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Select all options that apply to your company.
              </p>
            </div>

            {/* Multiple Selection Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {OBJECTIVE_OPTIONS.map(obj => {
                const isSelected = formData.esgObjectives.includes(obj.id);
                return (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => toggleObjective(obj.id)}
                    className={`flex cursor-pointer items-start gap-3 border-b py-4 text-left ${
                      isSelected ? 'border-emerald-500' : 'border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                    }`}>
                      {renderIconForObjective(obj.icon)}
                    </div>

                    <div>
                      <h3 className={`mb-0.5 text-sm font-bold ${isSelected ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-100'}`}>
                        {obj.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                        {obj.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 h-11 rounded-full font-semibold text-xs text-[#0f5238] dark:text-emerald-300 bg-[#0f5238]/10 hover:bg-[#0f5238]/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                disabled={formData.esgObjectives.length === 0}
                onClick={handleNextStep}
                className="px-8 h-11 rounded-full font-bold text-xs text-white bg-[#0f5238] hover:bg-[#0f5238]/90 disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Continue</span>
                <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: COMPLETION ================= */}
        {step === 5 && (
          <motion.div
            className="flex w-full max-w-md flex-col items-center text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <motion.div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            >
              <CheckCircle className="h-10 w-10" />
            </motion.div>
            <h1 className="mt-8 text-3xl font-semibold tracking-tight">
              {isId ? 'Profil siap' : 'Profile ready'}
            </h1>
            <p className="mt-3 text-lg italic text-slate-600 dark:text-slate-300">
              {isId
                ? 'Berikutnya 15 soal. Angka hijau itu yang jadi level.'
                : 'Next is 15 questions. The green score becomes the level.'}
            </p>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleCompleteOnboarding('assessment')}
              className="mt-8 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 font-semibold text-white disabled:opacity-50"
            >
              {isId ? 'Mulai asesmen' : 'Start assessment'}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleCompleteOnboarding('home')}
              className="mt-3 cursor-pointer text-sm font-semibold text-slate-500"
            >
              {isId ? 'Nanti, ke beranda' : 'Later, go home'}
            </button>
          </motion.div>
        )}
      </main>

      {/* Footer */}
    </div>
  );
};
