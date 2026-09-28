import { useState, useEffect } from 'react';
import { learnService } from '../../../core/services/learnService';
import { LearningModule } from '../../../core/types';

export function useLearnData() {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [activeModule, setActiveModule] = useState<LearningModule | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadModules = async () => {
    setIsLoading(true);
    try {
      const data = await learnService.getAllModules();
      setModules(data);
    } catch (err) {
      console.error('Error loading learn modules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const startModule = async (mod: LearningModule) => {
    const full = await learnService.getModuleById(mod.id);
    setActiveModule(full || mod);
    setActiveLessonIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
  };

  const submitQuizAnswer = (optionIdx: number) => {
    if (!activeModule) return;
    const currentLesson = activeModule.lessons[activeLessonIndex];
    const correct = optionIdx === currentLesson.quiz.correctAnswerIndex;

    setSelectedOption(optionIdx);
    setIsCorrect(correct);
    setIsAnswerSubmitted(true);
  };

  const prevLesson = () => {
    if (activeLessonIndex > 0) {
      setActiveLessonIndex(prev => prev - 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    }
  };

  const nextLessonOrComplete = async () => {
    if (!activeModule) return;

    if (activeLessonIndex < activeModule.lessons.length - 1) {
      setActiveLessonIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      await learnService.completeModule(activeModule.id);
      setModules(prev => prev.map(m => m.id === activeModule.id ? { ...m, completed: true } : m));
      setActiveModule(null);
    }
  };

  const completedCount = modules.filter(m => m.completed).length;
  const totalEarnedPoints = modules
    .filter(m => m.completed)
    .reduce((acc, curr) => acc + (curr.points || 0), 0);

  return {
    modules,
    activeModule,
    activeLessonIndex,
    selectedOption,
    isAnswerSubmitted,
    isCorrect,
    isLoading,
    completedCount,
    totalEarnedPoints,
    startModule,
    submitQuizAnswer,
    prevLesson,
    nextLessonOrComplete,
    refreshModules: loadModules,
    closeModulePlayer: () => setActiveModule(null),
  };
}
