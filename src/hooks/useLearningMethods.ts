import { useCallback } from 'react';
import type { LearnMethod, WordStats } from './useLearningState';

// Seeded random number generator for deterministic results
const seededRandom = (seed: number) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const useLearningMethods = () => {
  // Get question key for tracking
  const getQuestionKey = useCallback((question: string, answer: string): string => {
    return `${question}|${answer}`;
  }, []);

  // Get word statistics
  const getWordStats = useCallback((
    questionKey: string,
    lerenWordStats: Map<string, WordStats>
  ): WordStats => {
    return lerenWordStats.get(questionKey) || {
      attempts: 0,
      correctCount: 0,
      lastMethod: "gedachten" as const,
      methodsUsed: new Set<string>(),
    };
  }, []);

  // Check if question is completed in leren mode
  const isQuestionCompleteInLeren = useCallback((
    questionKey: string,
    lerenCompleted: Set<string>
  ): boolean => {
    return lerenCompleted.has(questionKey);
  }, []);

  // Adaptive method selection based on performance
  const selectOptimalMethod = useCallback((
    questionKey: string,
    lerenWordStats: Map<string, WordStats>
  ): LearnMethod => {
    const stats = lerenWordStats.get(questionKey) || {
      attempts: 0,
      correctCount: 0,
      lastMethod: "gedachten" as const,
      methodsUsed: new Set<string>(),
    };

    const { attempts, correctCount, methodsUsed } = stats;

    // Calculate success rate
    const successRate = attempts > 0 ? correctCount / attempts : 0;

    // Always try to use methods not used yet first, regardless of performance or attempts
    // Exclude "gedachten" from the leren mode - only use multikeuze, hints, and toets
    const unusedMethods = ["multikeuze", "hints", "toets"].filter(
      (method) => !methodsUsed.has(method)
    ) as LearnMethod[];

    if (unusedMethods.length > 0) {
      // Use seeded random to pick from unused methods for consistency
      const seed = questionKey.charCodeAt(0) + attempts;
      const randomIndex = Math.floor(
        seededRandom(seed) * unusedMethods.length
      );
      return unusedMethods[randomIndex];
    }

    // All methods used - now base on performance
    // If struggling (low success rate), use easier methods
    if (successRate < 0.4) {
      return "multikeuze"; // Just use multikeuze for struggling users
    }

    // If doing well (high success rate), challenge with harder methods
    if (successRate > 0.6) {
      const hardMethods: LearnMethod[] = ["hints", "toets"];
      const seed = questionKey.charCodeAt(0) + attempts;
      const randomIndex = Math.floor(seededRandom(seed) * hardMethods.length);
      return hardMethods[randomIndex];
    }

    // Medium performance - mix methods (excluding gedachten)
    const allMethods: LearnMethod[] = ["multikeuze", "hints", "toets"];
    const seed = questionKey.charCodeAt(0) + attempts;
    const randomIndex = Math.floor(seededRandom(seed) * allMethods.length);
    return allMethods[randomIndex];
  }, []);

  // Update word statistics
  const updateWordStats = useCallback((
    questionKey: string,
    isCorrect: boolean,
    method: LearnMethod,
    currentStats: Map<string, WordStats>,
    onProgressUpdate?: (completed: number, total: number) => void,
    initialMappedData: any[] = []
  ): {
    newStats: Map<string, WordStats>;
    newCompleted: Set<string>;
    shouldComplete: boolean;
  } => {
    const wordStats = currentStats.get(questionKey) || {
      attempts: 0,
      correctCount: 0,
      lastMethod: method,
      methodsUsed: new Set<string>(),
    };

    const newMethodsUsed = new Set(wordStats.methodsUsed);
    newMethodsUsed.add(method);

    const newWordStats = {
      attempts: wordStats.attempts + 1,
      correctCount: wordStats.correctCount + (isCorrect ? 1 : 0),
      lastMethod: method,
      methodsUsed: newMethodsUsed,
    };

    // Check if word should be completed (must use all 3 methods for best grades)
    const successRate = newWordStats.correctCount / newWordStats.attempts;
    const hasUsedAllMethods = newWordStats.methodsUsed.size >= 3; // Must use all 3 methods: multikeuze, hints, toets
    const hasGoodPerformance = successRate >= 0.6; // Good overall performance

    const shouldComplete = hasUsedAllMethods && hasGoodPerformance;

    const newStats = new Map(currentStats);
    newStats.set(questionKey, newWordStats);

    let newCompleted = new Set<string>();
    if (shouldComplete) {
      // This would need to be handled at the component level
      newCompleted.add(questionKey);
    }

    // Trigger immediate progress update after updating stats
    if (onProgressUpdate && initialMappedData.length > 0) {
      setTimeout(() => {
        const totalPossible = initialMappedData.length * 3;
        let totalCorrectAnswers = 0;

        // Count correct answers from all word stats (including this update)
        for (const [_, wordStats] of newStats) {
          totalCorrectAnswers += wordStats.correctCount;
        }

        onProgressUpdate(totalCorrectAnswers, totalPossible);
      }, 0);
    }

    return {
      newStats,
      newCompleted,
      shouldComplete,
    };
  }, []);

  return {
    getQuestionKey,
    getWordStats,
    isQuestionCompleteInLeren,
    selectOptimalMethod,
    updateWordStats,
    seededRandom,
  };
};