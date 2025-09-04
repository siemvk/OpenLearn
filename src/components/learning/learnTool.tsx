"use client";
// Niet aanraken, het werkt :3
// veel liefs, je favoriete protogen - andrei1010
import { useState, useCallback, useMemo, memo, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import dynamic from "next/dynamic";
import { useRouter } from 'next/navigation';
import { useStreakUpdate } from '@/hooks/useStreakUpdate';


// Import Lottie dynamically to avoid SSR issues
const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
});

import check from "@/app/img/check.svg";
import wrong from "@/app/img/wrong.svg";
import Button1 from "@/components/button/Button1";

function verwijderSpecialeTekens(tekst: string): string {
  return tekst
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .toLowerCase();
}

// Add a small, fast Levenshtein distance helper for typo detection
const levenshtein = (a: string, b: string): number => {
  const al = a.length, bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  const dp: number[][] = Array.from({ length: al + 1 }, () =>
    new Array(bl + 1).fill(0)
  );
  for (let i = 0; i <= al; i++) dp[i][0] = i;
  for (let j = 0; j <= bl; j++) dp[0][j] = j;
  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[al][bl];
};

// Constants for repeated styles and values
const STYLES = {
  questionCard: "p-4 bg-neutral-700 rounded-lg text-center mb-4 max-h-[120px] overflow-y-auto",
  centeredText: "text-center text-white p-4",
  overlay: "absolute z-50 bottom-0 left-0 right-0 flex items-center justify-center",
} as const;

const DELAYS = {
  correctOverlay: 1000,
  incorrectOverlay: 5000,
  animationLoad: 10,
  animationShow: 50,
} as const;

// Memoize the question display component
const QuestionDisplay = memo(({ question }: { question: string }) => (
  <div className="px-4 py-2 bg-neutral-700 rounded-lg mb-4 min-w-[240px] max-w-[400px] text-center">
    <span className="font-extrabold">{question}</span>
  </div>
));

// Memoize the answer overlay component
const AnswerOverlay = memo(
  ({ correct, answer }: { correct: boolean; answer?: string }) => (
    <motion.div
      className={`absolute z-50 bottom-0 left-0 right-0 flex items-center justify-center ${correct ? "bg-green-700" : "bg-red-700"} text-white rounded-lg text-2xl font-extrabold max-h-[60vh]`}
      initial={{ y: "100%" }}
      animate={{ y: "0%" }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="w-full py-4 max-h-[inherit] overflow-y-auto">
        {correct ? (
          <div className="flex items-center justify-center">
            <Image
              src={check}
              width={40}
              height={40}
              alt="check icon"
              className="mr-4"
            />
            Correct!
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-start px-4 w-full py-2">
            <Image
              src={wrong}
              width={40}
              height={40}
              alt="wrong icon"
              className="mr-4 flex-shrink-0 mb-2 md:mb-0 mt-1"
            />
            <div className="w-full text-center md:text-left">
              <span>Verkeerd! het antwoord was </span>
              <span className="pl-1 font-extrabold break-words">{answer}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
);

const GedachtenOverlay = memo(
  ({
    answer,
    onCorrect,
    onIncorrect,
  }: {
    answer: string;
    onCorrect: () => void;
    onIncorrect: () => void;
  }) => (
    <motion.div
      className="absolute z-50 bottom-0 left-0 right-0 flex flex-col items-center justify-center 
    bg-blue-500 text-white rounded-lg max-h-[60vh]"
      initial={{ y: "100%" }}
      animate={{ y: "0%" }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="w-full p-4 max-h-[inherit] overflow-y-auto">
        <div className="flex flex-col items-center px-4 max-w-full mb-3">
          <div className="overflow-hidden text-center">
            <span>Het antwoord was </span>
            <span className="pl-1 font-extrabold block break-words">
              {answer}
            </span>
            <span className="mt-2 block">Had je het goed?</span>
          </div>
        </div>
        <div className="flex gap-3 mt-2 justify-center">
          <Button1 onClick={onCorrect} text="Ja" />
          <Button1 onClick={onIncorrect} text="Nee" />
        </div>
      </div>
    </motion.div>
  )
);

// Typo overlay: ask user whether to count a near-correct answer as correct
const TypoOverlay = memo(
  ({ onGood, onBad }: { onGood: () => void; onBad: () => void }) => (
    <motion.div
      className="absolute z-50 bottom-0 left-0 right-0 flex flex-col items-center justify-center bg-yellow-600 text-white rounded-lg max-h-[60vh]"
      initial={{ y: "100%" }}
      animate={{ y: "0%" }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="w-full p-4 max-h-[inherit] overflow-y-auto text-center">
        <div className="font-extrabold text-xl mb-2">Je hebt een typfout gemaakt: { }</div>
        <div className="text-sm mb-4">Wil je dit als goed of fout rekenen?</div>
        <div className="flex gap-3 justify-center">
          <Button1 onClick={onGood} text="Goed rekenen" />
          <Button1 onClick={onBad} text="Fout rekenen" />
        </div>
      </div>
    </motion.div>
  )
);



// Replace the modal StreakScreen with an inline version
const StreakCelebration = memo(
  ({ streak, isNewStreak }: { streak: number; isNewStreak: boolean }) => {
    // Fix the type to accept any animation data
    const [animation, setAnimation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load animation on component mount
    useEffect(() => {
      // Preload the animation as early as possible
      const loadAnimation = async () => {
        try {
          // Add a slight delay to ensure component is fully mounted
          await new Promise((resolve) => setTimeout(resolve, DELAYS.animationLoad));
          const animationModule = await import("@/app/img/flame.json");
          setAnimation(animationModule.default);
          // Add a slight delay before showing to ensure smooth transition
          setTimeout(() => setIsLoading(false), DELAYS.animationShow);
        } catch (error) {
          console.error("Failed to load animation:", error);
          setIsLoading(false); // Show fallback on error
        }
      };

      loadAnimation();

      // Clean up any pending timeouts on unmount
      return () => {
        setAnimation(null);
      };
    }, []);

    return (
      <div className="w-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500 rounded-xl p-6 my-4">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 mb-2 relative flex items-center justify-center">
            <Lottie animationData={animation} loop={true} />
          </div>

          <h2 className="text-2xl font-bold mb-2 text-white text-center">
            Je hebt een reeks gestart!
          </h2>

          <div className="text-5xl font-bold text-orange-400 my-4 text-center">
            {streak}{" "}
            <span className="text-lg">{streak === 1 ? "dag" : "dagen"}</span>
          </div>

          <p className="text-center text-gray-300">
            Je bent goed bezig! Blijf elke dag leren om je reeks te behouden.
          </p>
        </div>
      </div>
    );
  }
);

// Memoize the multi-choice button component
const MultiChoiceButton = memo(
  ({
    onClick,
    isCorrect,
    optionNumber,
    text,
    disabled,
  }: {
    onClick: () => void;
    isCorrect: boolean;
    optionNumber: number;
    text: string;
    disabled: boolean;
  }) => {
    const needsClamp = text.length > 40;
    return (
      <div className="relative transform-gpu h-full w-full">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full h-full">
                <Button1
                  onClick={onClick}
                  disabled={disabled}
                  text={text}
                  wrapText={needsClamp}
                  textClassName="text-sm"
                  className="w-full border border-neutral-700"
                />
              </div>
            </TooltipTrigger>
            {needsClamp && (
              <TooltipContent className="z-[999] bg-neutral-900 border border-neutral-700 text-white max-w-xs text-xs p-2 whitespace-normal break-words">
                {text}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
);

const getHint = (answer: string): string => {
  if (!answer || answer.length === 0) return "";

  // Make a working copy to avoid modifying original
  let workingAnswer = answer;

  // Handle parenthesized content - either show it as optional or remove it
  // based on the existing logic in handleAntwoordControleren
  if (answer.includes("(") && answer.includes(")")) {
    // Show parenthesized content as optional in hint
    workingAnswer = workingAnswer.replace(/\(([^)]+)\)/g, "($1)");
  }

  // Check if the answer has multiple options (separated by slash or "of")
  if (workingAnswer.includes("/") || workingAnswer.includes(" of ")) {
    const parts = workingAnswer.split(/\s*(?:of|\/)\s*/);

    // Generate a hint for each alternative answer
    const hints = parts.map((part) => {
      return part
        .trim()
        .split(" ")
        .map((word) => {
          if (word.length === 0) return "";
          return word.charAt(0) + "_".repeat(word.length - 1);
        })
        .join(" ");
    });

    // Join the hints with the same separator that was in the original answer
    return workingAnswer.includes("/") ? hints.join(" / ") : hints.join(" of ");
  }

  // Original behavior for single answers
  return workingAnswer
    .split(" ")
    .map((word) => {
      if (word.length === 0) return "";
      return word.charAt(0) + "_".repeat(word.length - 1);
    })
    .join(" ");
};

const LearnTool = ({
  mode,
  rawlistdata,
  onCorrectAnswer,
  onWrongAnswer,
  onProgressUpdate,
  onComplete,
}: {
  mode: "toets" | "gedachten" | "hints" | "learn" | "multikeuze" | "leren";
  rawlistdata: any[];
  onCorrectAnswer?: () => void;
  onWrongAnswer?: () => void;
  onProgressUpdate?: (completed: number, total: number) => void;
  onComplete?: () => void;
}) => {
  const router = useRouter();
  const { handleListCompletion } = useStreakUpdate();  // Seeded random number generator for deterministic results
  // Simple utility functions (no need for useCallback with empty deps)
  const seededRandom = (seed: number) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const getQuestionKey = (question: string, answer: string): string => {
    return `${question}|${answer}`;
  };

  // Create a deterministic shuffle based on list content
  const shuffleArray = useCallback(
    <T,>(array: T[]): T[] => {
      if (array.length === 0) return array;

      // Create a seed based on the array content for deterministic results
      let seed = 0;
      for (let i = 0; i < array.length; i++) {
        const item = array[i];
        if (item && typeof item === "object") {
          // Type-safe property access
          const str =
            ((item as any).vraag || (item as any)["1"] || "") +
            ((item as any).antwoord || (item as any)["2"] || "");
          for (let j = 0; j < str.length; j++) {
            seed = ((seed << 5) - seed + str.charCodeAt(j)) & 0xffffffff;
          }
        } else {
          const str = String(item || "");
          for (let j = 0; j < str.length; j++) {
            seed = ((seed << 5) - seed + str.charCodeAt(j)) & 0xffffffff;
          }
        }
      }

      // Use seeded random for deterministic shuffle
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed + i) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    },
    [seededRandom]
  );

  // Use useMemo for initial data processing
  const initialMappedData = useMemo(() => {
    if (
      !rawlistdata ||
      !Array.isArray(rawlistdata) ||
      rawlistdata.length === 0
    ) {
      return [];
    }

    return rawlistdata
      .map((item) => ({
        vraag: item.vraag || item["1"] || "",
        antwoord: item.antwoord || item["2"] || "",
      }))
      .filter((item) => item.vraag && item.antwoord);
  }, [rawlistdata]);

  // Initialize data with deterministic values to prevent hydration mismatch
  const [lijstData, setLijstData] = useState<any[]>(() => {
    if (
      !rawlistdata ||
      !Array.isArray(rawlistdata) ||
      rawlistdata.length === 0
    ) {
      return [];
    }
    // Use deterministic shuffling based on content
    const mappedData = rawlistdata
      .map((item) => ({
        vraag: item.vraag || item["1"] || "",
        antwoord: item.antwoord || item["2"] || "",
      }))
      .filter((item) => item.vraag && item.antwoord);

    // Generate deterministic seed from content
    let seed = 0;
    for (const item of mappedData) {
      const str = (item.vraag || "") + (item.antwoord || "");
      for (let i = 0; i < str.length; i++) {
        seed = ((seed << 5) - seed + str.charCodeAt(i)) & 0xffffffff;
      }
    }

    // Deterministic shuffle using seeded random
    const shuffled = [...mappedData];
    for (let i = shuffled.length - 1; i > 0; i--) {
      let x = Math.sin(seed + i) * 10000;
      const random = x - Math.floor(x);
      const j = Math.floor(random * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  // Consolidate UI overlay state into single object to reduce re-renders
  const [overlays, setOverlays] = useState({
    toonAntwoord: false,
    showCorrect: false,
    showGedachtenOverlay: false,
    isAnswering: false,
    toonTypo: false, // show a near-correct / typo overlay
  });

  // Consolidate learning progress state
  const [learningState, setLearningState] = useState({
    listCompleted: false,
    streakUpdateTriggered: false,
    currentLerenMethod: "multikeuze" as "gedachten" | "multikeuze" | "hints" | "toets",
  });

  // Consolidated stats and UI state
  const [stats, setStats] = useState({
    streakInfo: {
      currentStreak: 0,
      isNewStreak: false,
    },
    lerenWordStats: new Map<
      string,
      {
        attempts: number;
        correctCount: number;
        lastMethod: "gedachten" | "multikeuze" | "hints" | "toets";
        methodsUsed: Set<string>;
      }
    >(),
    lerenCompleted: new Set<string>(),
  });

  const [uiState, setUiState] = useState({
    userInput: "",
    randomNumber: (() => {
      if (
        !rawlistdata ||
        !Array.isArray(rawlistdata) ||
        rawlistdata.length === 0
      ) {
        return 1;
      }
      let seed = 0;
      for (const item of rawlistdata.slice(0, 5)) {
        const str =
          (item.vraag || item["1"] || "") + (item.antwoord || item["2"] || "");
        for (let i = 0; i < str.length; i++) {
          seed = ((seed << 5) - seed + str.charCodeAt(i)) & 0xffffffff;
        }
      }
      let x = Math.sin(seed) * 10000;
      const random = x - Math.floor(x);
      return Math.floor(random * 4) + 1;
    })(),
  });

  // Helper functions to update consolidated state
  const updateOverlay = (key: keyof typeof overlays, value: boolean) => {
    setOverlays(prev => ({ ...prev, [key]: value }));
  };

  const updateLearningState = (key: keyof typeof learningState, value: any) => {
    setLearningState(prev => ({ ...prev, [key]: value }));
  };

  const updateStats = (key: keyof typeof stats, value: any) => {
    setStats(prev => ({ ...prev, [key]: value }));
  };

  const updateUiState = (key: keyof typeof uiState, value: any) => {
    setUiState(prev => ({ ...prev, [key]: value }));
  };

  // Destructure for easier access
  const { toonAntwoord, showCorrect, showGedachtenOverlay, isAnswering, toonTypo } = overlays;
  const { listCompleted, streakUpdateTriggered, currentLerenMethod } = learningState;
  const { streakInfo, lerenWordStats, lerenCompleted } = stats;
  const { userInput, randomNumber } = uiState;

  // Aliases for backward compatibility during migration
  const setToonAntwoord = (value: boolean) => updateOverlay('toonAntwoord', value);
  const setShowCorrect = (value: boolean) => updateOverlay('showCorrect', value);
  const setShowGedachtenOverlay = (value: boolean) => updateOverlay('showGedachtenOverlay', value);
  const setIsAnswering = (value: boolean) => updateOverlay('isAnswering', value);
  const setToonTypo = (value: boolean) => updateOverlay('toonTypo', value);
  const setListCompleted = (value: boolean) => updateLearningState('listCompleted', value);
  const setStreakUpdateTriggered = (value: boolean) => updateLearningState('streakUpdateTriggered', value);
  const setCurrentLerenMethod = (value: "gedachten" | "multikeuze" | "hints" | "toets") => updateLearningState('currentLerenMethod', value);
  const setStreakInfo = (value: any) => updateStats('streakInfo', value);
  const setLerenWordStats = (value: Map<string, { attempts: number; correctCount: number; lastMethod: "gedachten" | "multikeuze" | "hints" | "toets"; methodsUsed: Set<string>; }> | ((prev: Map<string, { attempts: number; correctCount: number; lastMethod: "gedachten" | "multikeuze" | "hints" | "toets"; methodsUsed: Set<string>; }>) => Map<string, { attempts: number; correctCount: number; lastMethod: "gedachten" | "multikeuze" | "hints" | "toets"; methodsUsed: Set<string>; }>)) => {
    if (typeof value === 'function') {
      updateStats('lerenWordStats', value(stats.lerenWordStats));
    } else {
      updateStats('lerenWordStats', value);
    }
  };
  const setLerenCompleted = (value: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (typeof value === 'function') {
      updateStats('lerenCompleted', value(stats.lerenCompleted));
    } else {
      updateStats('lerenCompleted', value);
    }
  };
  const setUserInput = (value: string) => updateUiState('userInput', value);
  const setRandomNumber = (value: number) => updateUiState('randomNumber', value);


  // Computed values for UI state
  const locked = overlays.toonAntwoord || overlays.showCorrect || overlays.showGedachtenOverlay || overlays.toonTypo;

  // Generate deterministic random number for multiple choice
  const generateRandomNumber = useCallback(() => {
    // Use current question content as seed for consistency
    let seed = 0;
    if (lijstData.length > 0) {
      const currentItem = lijstData[0];
      const str = (currentItem?.vraag || "") + (currentItem?.antwoord || "");
      for (let i = 0; i < str.length; i++) {
        seed = ((seed << 5) - seed + str.charCodeAt(i)) & 0xffffffff;
      }
      // Add current list length to vary the seed when questions change
      seed += lijstData.length;
    }
    return Math.floor(seededRandom(seed) * 4) + 1;
  }, [lijstData, seededRandom]);

  // Refs for input elements to enable autofocus
  const toetsInputRef = useRef<HTMLInputElement>(null);
  const hintsInputRef = useRef<HTMLInputElement>(null);

  // Preserve the submitted input when a typo is detected so overlays show the original text
  const [typoSubmitted, setTypoSubmitted] = useState<string | null>(null);

  // Track current question and reset input when it changes
  const currentQuestion = lijstData.length > 0 ? lijstData[0]?.vraag || "" : "";

  // Combined effect for input and UI state management
  useEffect(() => {
    // Reset input when question changes
    setUserInput("");

    // Reset isAnswering when no overlays are visible (for multiple choice)
    if (
      !locked &&
      isAnswering &&
      (mode === "multikeuze" ||
        (mode === "leren" && currentLerenMethod === "multikeuze"))
    ) {
      setIsAnswering(false);
    }
  }, [currentQuestion, locked, isAnswering, mode, currentLerenMethod]);

  // Combined effect for input management and autofocus
  useEffect(() => {
    if (!locked && lijstData.length > 0) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        if (
          (mode === "toets" ||
            (mode === "leren" && currentLerenMethod === "toets")) &&
          toetsInputRef.current
        ) {
          toetsInputRef.current.focus();
        } else if (
          (mode === "hints" ||
            (mode === "leren" && currentLerenMethod === "hints")) &&
          hintsInputRef.current
        ) {
          hintsInputRef.current.focus();
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [locked, mode, currentLerenMethod, lijstData.length, currentQuestion]);

  const getWordStats = useCallback(
    (questionKey: string) => {
      return (
        lerenWordStats.get(questionKey) || {
          attempts: 0,
          correctCount: 0,
          lastMethod: "gedachten" as const,
          methodsUsed: new Set<string>(),
        }
      );
    },
    [lerenWordStats]
  );

  // Simple lookup function - no need for useCallback
  const isQuestionCompleteInLeren = (questionKey: string): boolean => {
    return lerenCompleted.has(questionKey);
  };

  // Adaptive method selection based on performance
  const selectOptimalMethod = useCallback(
    (questionKey: string): "gedachten" | "multikeuze" | "hints" | "toets" => {
      const stats = getWordStats(questionKey);
      const { attempts, correctCount, methodsUsed } = stats;

      // Calculate success rate
      const successRate = attempts > 0 ? correctCount / attempts : 0;

      // Always try to use methods not used yet first, regardless of performance or attempts
      // Exclude "gedachten" from the leren mode - only use multikeuze, hints, and toets
      const unusedMethods = ["multikeuze", "hints", "toets"].filter(
        (method) => !methodsUsed.has(method)
      ) as ("gedachten" | "multikeuze" | "hints" | "toets")[];

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
        // Cycle through easier methods (excluding gedachten)
        const easyMethods: ("gedachten" | "multikeuze" | "hints" | "toets")[] =
          ["multikeuze"];
        return easyMethods[0]; // Just use multikeuze for struggling users
      }

      // If doing well (high success rate), challenge with harder methods
      if (successRate > 0.6) {
        // Cycle through harder methods
        const hardMethods: ("gedachten" | "multikeuze" | "hints" | "toets")[] =
          ["hints", "toets"];
        const seed = questionKey.charCodeAt(0) + attempts;
        const randomIndex = Math.floor(seededRandom(seed) * hardMethods.length);
        return hardMethods[randomIndex];
      }

      // Medium performance - mix methods (excluding gedachten)
      const allMethods: ("gedachten" | "multikeuze" | "hints" | "toets")[] = [
        "multikeuze",
        "hints",
        "toets",
      ];
      const seed = questionKey.charCodeAt(0) + attempts;
      const randomIndex = Math.floor(seededRandom(seed) * allMethods.length);
      return allMethods[randomIndex];
    },
    [getWordStats, seededRandom]
  );

  const updateWordStats = useCallback(
    (
      questionKey: string,
      isCorrect: boolean,
      method: "gedachten" | "multikeuze" | "hints" | "toets"
    ) => {
      setLerenWordStats((prev) => {
        const currentStats = prev.get(questionKey) || {
          attempts: 0,
          correctCount: 0,
          lastMethod: method,
          methodsUsed: new Set<string>(),
        };

        const newMethodsUsed = new Set(currentStats.methodsUsed);
        newMethodsUsed.add(method);

        const newStats = {
          attempts: currentStats.attempts + 1,
          correctCount: currentStats.correctCount + (isCorrect ? 1 : 0),
          lastMethod: method,
          methodsUsed: newMethodsUsed,
        };

        // Check if word should be completed (must use all 3 methods for best grades)
        const successRate = newStats.correctCount / newStats.attempts;
        const hasUsedAllMethods = newStats.methodsUsed.size >= 3; // Must use all 3 methods: multikeuze, hints, toets
        const hasGoodPerformance = successRate >= 0.6; // Good overall performance

        if (hasUsedAllMethods && hasGoodPerformance) {
          setLerenCompleted((prevCompleted) => {
            const newCompleted = new Set([...prevCompleted, questionKey]);
            return newCompleted;
          });
        }

        const newMap = new Map(prev);
        newMap.set(questionKey, newStats);

        // Trigger immediate progress update after updating stats
        setTimeout(() => {
          if (onProgressUpdate && initialMappedData.length > 0) {
            const totalPossible = initialMappedData.length * 3;
            let totalCorrectAnswers = 0;

            // Count correct answers from all word stats (including this update)
            newMap.forEach((wordStats) => {
              totalCorrectAnswers += wordStats.correctCount;
            });

            onProgressUpdate(totalCorrectAnswers, totalPossible);
          }
        }, 0);

        return newMap;
      });
    },
    [onProgressUpdate, initialMappedData, getQuestionKey]
  );

  // Update current method when the current question changes in "leren" mode
  const currentQuestionKey = mode === "leren" && lijstData.length > 0 && lijstData[0]
    ? getQuestionKey(lijstData[0].vraag, lijstData[0].antwoord)
    : null;

  useEffect(() => {
    if (currentQuestionKey && mode === "leren") {
      // Only update method when question actually changes, not when overlays change
      const optimalMethod = selectOptimalMethod(currentQuestionKey);
      // Only update if the method has actually changed
      if (optimalMethod !== currentLerenMethod) {
        setCurrentLerenMethod(optimalMethod);
      }
    }
  }, [currentQuestionKey, mode, selectOptimalMethod, lerenWordStats]); // Include lerenWordStats to recalculate when stats change

  // Handle focus and keyboard events when locked
  useEffect(() => {
    if (locked) {
      // Remove focus from any active element
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // Handle keyboard events while locked
      const handleKeyDown = (e: KeyboardEvent) => {
        // Allow Enter key to dismiss overlays and immediately move to next question
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();

          // Handle overlays in priority order and immediately progress
          if (showGedachtenOverlay) {
            // For gedachten overlay, Enter doesn't dismiss it as user needs to choose yes/no
            return;
          } else if (toonAntwoord) {
            // Handle wrong answer overlay - immediately move question to end or handle "leren" progression
            setToonAntwoord(false);

            // Small delay after overlay dismissal to avoid visual jarring
            setTimeout(() => {
              if (lijstData.length > 0) {
                const [huidigeVraag, ...rest] = lijstData;

                if (mode === "leren") {
                  // For "leren" mode, check if question should be removed or moved to end
                  const questionKey = getQuestionKey(
                    huidigeVraag.vraag,
                    huidigeVraag.antwoord
                  );
                  if (isQuestionCompleteInLeren(questionKey)) {
                    // Question completed all steps, filter it out
                    const filteredRest = rest.filter((item) => {
                      const itemKey = getQuestionKey(item.vraag, item.antwoord);
                      return !isQuestionCompleteInLeren(itemKey);
                    });

                    // Check if this was the last question - if so, mark as completed immediately
                    if (filteredRest.length === 0) {
                      setListCompleted(true);
                    }

                    setLijstData(filteredRest);
                  } else {
                    // Move question to end to try again
                    setLijstData([...rest, huidigeVraag]);
                  }
                } else {
                  setLijstData([...rest, huidigeVraag]);
                }
                setUserInput("");
              }
            }, 100); // Shorter delay for manual dismissal
          } else if (showCorrect) {
            // Handle correct answer overlay - immediately move to next question or next step
            setShowCorrect(false);
            // Ensure typo overlay also hidden
            setToonTypo(false);

            // Small delay after overlay dismissal to avoid visual jarring
            setTimeout(() => {
              if (lijstData.length > 0) {
                const [huidigeVraag, ...rest] = lijstData;

                if (mode === "leren") {
                  // For "leren" mode, check if question should be removed or moved to end for next step
                  const questionKey = getQuestionKey(
                    huidigeVraag.vraag,
                    huidigeVraag.antwoord
                  );
                  if (isQuestionCompleteInLeren(questionKey)) {
                    // Question completed all steps, filter it out
                    const filteredRest = rest.filter((item) => {
                      const itemKey = getQuestionKey(item.vraag, item.antwoord);
                      return !isQuestionCompleteInLeren(itemKey);
                    });

                    // Check if this was the last question - if so, mark as completed immediately
                    if (filteredRest.length === 0) {
                      setListCompleted(true);
                    }

                    setLijstData(shuffleArray(filteredRest));
                  } else {
                    // For "leren" mode, always move the word to the end after each answer
                    // This ensures we cycle through different words instead of staying on the same word
                    setLijstData([...rest, huidigeVraag]);
                  }
                } else {
                  // Check if this was the last question in regular mode
                  if (rest.length === 0) {
                    setListCompleted(true);
                  }
                  setLijstData(shuffleArray(rest));
                }
                setUserInput("");
                // For multiple choice, generate new random number
                if (
                  mode === "multikeuze" ||
                  (mode === "leren" && currentLerenMethod === "multikeuze")
                ) {
                  setRandomNumber(generateRandomNumber());
                  setIsAnswering(false);
                }
              }
            }, 100); // Shorter delay for manual dismissal
          }
        } else {
          // Prevent other keyboard actions
          e.preventDefault();
          e.stopPropagation();
        }
      };

      // Add a global event listener with capture phase
      window.addEventListener("keydown", handleKeyDown, true);

      return () => {
        window.removeEventListener("keydown", handleKeyDown, true);
      };
    }
  }, [
    locked,
    toonAntwoord,
    showCorrect,
    showGedachtenOverlay,
    lijstData,
    shuffleArray,
    setUserInput,
    mode,
    generateRandomNumber,
    currentLerenMethod,
    getQuestionKey,
    isQuestionCompleteInLeren,
    getWordStats,
  ]);

  // Auto-dismiss correct overlay after 1 second
  useEffect(() => {
    if (showCorrect) {
      const timer = setTimeout(() => {
        setShowCorrect(false);
        // ensure typo overlay also hidden
        setToonTypo(false);
        setTypoSubmitted(null);

        // Small delay after overlay dismissal to avoid visual jarring
        setTimeout(() => {
          if (lijstData.length > 0) {
            const [huidigeVraag, ...rest] = lijstData;

            if (mode === "leren") {
              // For "leren" mode, check if question should be removed or moved to end for next step
              const questionKey = getQuestionKey(
                huidigeVraag.vraag,
                huidigeVraag.antwoord
              );
              if (isQuestionCompleteInLeren(questionKey)) {
                // Question completed all steps, filter it out
                const filteredRest = rest.filter((item) => {
                  const itemKey = getQuestionKey(item.vraag, item.antwoord);
                  return !isQuestionCompleteInLeren(itemKey);
                });

                // Check if this was the last question - if so, mark as completed immediately
                if (filteredRest.length === 0) {
                  setListCompleted(true);
                }

                setLijstData(shuffleArray(filteredRest));
              } else {
                // For "leren" mode, always move the word to the end after each answer
                // This ensures we cycle through different words instead of staying on the same word
                setLijstData([...rest, huidigeVraag]);
              }
            } else {
              // Check if this was the last question in regular mode
              if (rest.length === 0) {
                setListCompleted(true);
              }
              const nextList = shuffleArray(rest);
              setLijstData(nextList);
            }
            setUserInput("");
            if (
              mode === "multikeuze" ||
              (mode === "leren" && currentLerenMethod === "multikeuze")
            ) {
              setRandomNumber(generateRandomNumber());
              setIsAnswering(false);
            }
          }
        }, 200); // 200ms delay after overlay dismissal
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    showCorrect,
    lijstData,
    shuffleArray,
    generateRandomNumber,
    mode,
    currentLerenMethod,
    getQuestionKey,
    isQuestionCompleteInLeren,
    getWordStats,
  ]);

  // Auto-dismiss incorrect overlay after 5 seconds
  useEffect(() => {
    if (toonAntwoord) {
      const timer = setTimeout(() => {
        setToonAntwoord(false);

        // Small delay after overlay dismissal to avoid visual jarring
        setTimeout(() => {
          if (lijstData.length > 0) {
            const [huidigeVraag, ...rest] = lijstData;

            if (mode === "leren") {
              // For "leren" mode, check if question should be removed or moved to end
              const questionKey = getQuestionKey(
                huidigeVraag.vraag,
                huidigeVraag.antwoord
              );
              if (isQuestionCompleteInLeren(questionKey)) {
                // Question completed all steps, filter it out
                const filteredRest = rest.filter((item) => {
                  const itemKey = getQuestionKey(item.vraag, item.antwoord);
                  return !isQuestionCompleteInLeren(itemKey);
                });

                // Check if this was the last question - if so, mark as completed immediately
                if (filteredRest.length === 0) {
                  setListCompleted(true);
                }

                setLijstData(filteredRest);
              } else {
                // Move question to end to try again
                setLijstData([...rest, huidigeVraag]);
              }
            } else {
              setLijstData([...rest, huidigeVraag]);
            }
            setUserInput("");
            // Reset isAnswering for multiple choice modes
            if (
              mode === "multikeuze" ||
              (mode === "leren" && currentLerenMethod === "multikeuze")
            ) {
              setIsAnswering(false);
            }
          }
        }, 200); // 200ms delay after overlay dismissal
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [
    toonAntwoord,
    lijstData,
    mode,
    getQuestionKey,
    isQuestionCompleteInLeren,
    currentLerenMethod,
  ]);

  // Allow keyboard interactions for gedachten overlay
  useEffect(() => {
    if (showGedachtenOverlay) {
      // Allow keyboard events specifically for the gedachten overlay
      // This creates a separate effect that doesn't interfere with the locked effect
      const handleGedachtenKeyDown = (e: KeyboardEvent) => {
        // Allow key events for the Yes/No buttons but protect against unwanted key events
        if (!["Tab", "Enter", " "].includes(e.key)) {
          e.preventDefault();
        }
      };

      window.addEventListener("keydown", handleGedachtenKeyDown, false);

      return () => {
        window.removeEventListener("keydown", handleGedachtenKeyDown, false);
      };
    }
  }, [showGedachtenOverlay]);

  // Add an effect to update streak when the list is completed
  useEffect(() => {
    // For "leren" mode, check if all questions are completed
    const isListComplete =
      mode === "leren"
        ? initialMappedData.length > 0 &&
        initialMappedData.every((item) => {
          const questionKey = getQuestionKey(item.vraag, item.antwoord);
          return isQuestionCompleteInLeren(questionKey);
        })
        : initialMappedData.length > 0 && lijstData.length === 0;

    // Only run when the list changes from not-completed to completed AND we haven't triggered streak update yet
    if (isListComplete && !streakUpdateTriggered) {
      setListCompleted(true);
      setStreakUpdateTriggered(true);

      // Call the completion callback if provided
      if (onComplete) {
        onComplete();
      }

      // Immediately show streak celebration (assume streak will be started)
      setStreakInfo({
        currentStreak: 1,
        isNewStreak: true,
      });

      const updateStreak = async () => {
        try {
          // Use the streak store hook (update in background)
          const result = await handleListCompletion();

          // Update with actual result if different from assumption
          if (result.success && result.currentStreak !== undefined) {
            setStreakInfo({
              currentStreak: result.currentStreak,
              isNewStreak: result.isNewStreak === true,
            });
          }
        } catch (error) {
          console.error("Error updating streak:", error);
          // Keep the optimistic UI showing celebration even if update fails
        }
      };

      updateStreak();
    }
  }, [
    initialMappedData,
    streakUpdateTriggered,
    mode,
    getQuestionKey,
    isQuestionCompleteInLeren,
    lijstData.length,
    onComplete,
    handleListCompletion,
  ]);

  // Detect when the session is completed and set the listCompleted flag
  useEffect(() => {
    const isCompleted =
      mode === "leren"
        ? initialMappedData.length > 0 && initialMappedData.every((item) => {
          const questionKey = getQuestionKey(item.vraag, item.antwoord);
          return isQuestionCompleteInLeren(questionKey);
        })
        : lijstData.length === 0 && initialMappedData.length > 0;

    if (isCompleted && !listCompleted) {
      setListCompleted(true);
    }

    // Also trigger streak update here as a fallback if it hasn't been triggered yet
    if (isCompleted && !streakUpdateTriggered) {
      setStreakUpdateTriggered(true);

      // Immediately show streak celebration (assume streak will be started)
      setStreakInfo({
        currentStreak: 1,
        isNewStreak: true,
      });

      (async () => {
        try {
          const result = await handleListCompletion();

          // Update with actual result if different from assumption
          if (result.success && result.currentStreak !== undefined) {
            setStreakInfo({
              currentStreak: result.currentStreak,
              isNewStreak: result.isNewStreak === true,
            });
          }
        } catch (e) {
          console.error('Error in second effect streak update:', e);
          // Keep the optimistic UI showing celebration even if update fails
        }
      })();
    }
  }, [mode, initialMappedData, lijstData.length, isQuestionCompleteInLeren, listCompleted, streakUpdateTriggered, handleListCompletion]);

  // Track progress whenever questions are answered
  useEffect(() => {
    if (onProgressUpdate && initialMappedData.length > 0) {
      if (mode === "leren") {
        // For "leren" mode, count total correct answers across all words
        const totalPossible = initialMappedData.length * 3;
        let totalCorrectAnswers = 0;

        lerenWordStats.forEach((stats) => {
          totalCorrectAnswers += stats.correctCount;
        });

        onProgressUpdate(totalCorrectAnswers, totalPossible);
      } else {
        // For other modes, use the standard calculation
        const total = initialMappedData.length;
        const completed = total - lijstData.length;
        onProgressUpdate(completed, total);
      }
    }
  }, [
    initialMappedData.length,
    lijstData.length,
    onProgressUpdate,
    mode,
    lerenWordStats,
  ]);

  const handleAntwoordControleren = useCallback(() => {
    // Don't process if locked (overlay is showing) or no input
    if (locked || !lijstData.length || userInput.trim() === "") return;

    const [huidigeVraag, ...rest] = lijstData;
    let huidigAntwoordZonderSpecialeTekens = verwijderSpecialeTekens(
      huidigeVraag.antwoord
    );
    let userInputZonderSpecialeTekens = verwijderSpecialeTekens(userInput);
    let userInputCorrect = false;

    // simple goed antwoord
    if (huidigAntwoordZonderSpecialeTekens === userInputZonderSpecialeTekens) {
      userInputCorrect = true;
    }
    // goed antwoord met "of" of "/"
    if (
      huidigeVraag.antwoord.includes("of") ||
      huidigeVraag.antwoord.includes("/")
    ) {
      const antwoorden = huidigeVraag.antwoord
        .split(/\s*(?:of|\/)\s*/)
        .map((antwoord: string) => antwoord.trim());
      antwoorden.forEach((antwoord: string) => {
        if (
          userInputZonderSpecialeTekens.trim() ===
          verwijderSpecialeTekens(antwoord).trim()
        ) {
          userInputCorrect = true;
          return;
        }
      });
    }
    // goed antwoord zonder dingen tussen haakjes
    if (
      huidigeVraag.antwoord.includes("(") &&
      huidigeVraag.antwoord.includes(")")
    ) {
      const antwoordZonderHaakjes = huidigeVraag.antwoord
        .replace(/\(.*?\)/g, "")
        .trim();
      if (
        userInputZonderSpecialeTekens ===
        verwijderSpecialeTekens(antwoordZonderHaakjes)
      ) {
        userInputCorrect = true;
      }
    }

    // TYPO DETECTION: if not exact but very similar, treat as near-correct
    let detectedTypo = false;
    if (!userInputCorrect) {
      const dist = levenshtein(huidigAntwoordZonderSpecialeTekens, userInputZonderSpecialeTekens);
      const maxLen = Math.max(huidigAntwoordZonderSpecialeTekens.length, userInputZonderSpecialeTekens.length) || 1;
      const normalized = dist / maxLen;
      // threshold: 25% of length (adjustable). ignore very short words.
      if (normalized <= 0.25 && maxLen > 2) {
        detectedTypo = true;
      }
    }

    if (userInputCorrect) {
      setShowCorrect(true);
      if (onCorrectAnswer) onCorrectAnswer();

      // Handle "leren" mode progression
      if (mode === "leren") {
        const questionKey = getQuestionKey(
          huidigeVraag.vraag,
          huidigeVraag.antwoord
        );
        updateWordStats(questionKey, true, currentLerenMethod);
      }

      // No timeout - let Enter key handle progression
    } else if (detectedTypo) {
      // Preserve the user's submitted text and show the typo overlay
      setTypoSubmitted(userInput);
      setToonTypo(true);
    } else {
      setToonAntwoord(true);
      if (onWrongAnswer) onWrongAnswer();

      // Handle "leren" mode progression (incorrect answer doesn't advance)
      if (mode === "leren") {
        const questionKey = getQuestionKey(
          huidigeVraag.vraag,
          huidigeVraag.antwoord
        );
        updateWordStats(questionKey, false, currentLerenMethod);
      }

      // No timeout - let Enter key handle progression
    }
  }, [
    lijstData,
    userInput,
    onCorrectAnswer,
    onWrongAnswer,
    locked,
    mode,
    getQuestionKey,
    updateWordStats,
    currentLerenMethod,
  ]);

  // Handlers for TypoOverlay buttons

  // TypoOverlay component
  const TypoOverlayComponent = memo(
    ({
      answer,
      submitted,
      onGood,
      onBad,
    }: {
      answer: string;
      submitted: string;
      onGood: () => void;
      onBad: () => void;
    }) => (
      <motion.div
        className="absolute z-50 bottom-0 left-0 right-0 flex items-center justify-center bg-yellow-600 text-white rounded-lg max-h-[60vh]"
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="w-full p-4 max-h-[inherit] overflow-y-auto">
          <div className="flex flex-col items-center px-4 max-w-full mb-3">
            <div className="overflow-hidden text-center">
              <div className="font-extrabold mb-2">Je hebt een typfout gemaakt</div>
              <div className="block break-words text-sm opacity-90 mb-2">Verwacht: <span className="font-semibold">{answer}</span></div>
              <div className="block break-words text-sm">Ingevuld: <span className="italic">{submitted || "niets ingevuld"}</span></div>
            </div>
          </div>
          <div className="flex gap-3 mt-2 justify-center">
            <Button1 onClick={onGood} text="Goed rekenen" />
            <Button1 onClick={onBad} text="Fout rekenen" />
          </div>
        </div>
      </motion.div>
    )
  );

  const handleTypoConfirm = useCallback(() => {
    // User chooses to count typo as correct
    if (!lijstData.length) return;
    const [huidigeVraag, ...rest] = lijstData;
    // Give credit
    if (onCorrectAnswer) onCorrectAnswer();
    if (mode === "leren") {
      const questionKey = getQuestionKey(
        huidigeVraag.vraag,
        huidigeVraag.antwoord
      );
      updateWordStats(questionKey, true, currentLerenMethod);
    }

    // Hide typo overlay and show correct overlay for consistency
    setToonTypo(false);
    setTypoSubmitted(null);
    setShowCorrect(true);
  }, [lijstData, onCorrectAnswer, mode, getQuestionKey, updateWordStats, currentLerenMethod]);

  const handleTypoReject = useCallback(() => {
    // User chooses to count typo as incorrect
    if (!lijstData.length) return;
    const [huidigeVraag, ...rest] = lijstData;
    if (onWrongAnswer) onWrongAnswer();
    if (mode === "leren") {
      const questionKey = getQuestionKey(
        huidigeVraag.vraag,
        huidigeVraag.antwoord
      );
      updateWordStats(questionKey, false, currentLerenMethod);
    }

    // Hide typo overlay and show wrong overlay
    setToonTypo(false);
    setTypoSubmitted(null);
    setToonAntwoord(true);
  }, [lijstData, onWrongAnswer, mode, getQuestionKey, updateWordStats, currentLerenMethod]);

  // Renamed from handleAntwoordControlerenGedachten
  const handleSelfAssessment = useCallback(
    (isAntwoordCorrect: boolean) => {
      if (!lijstData.length) return;

      // Dismiss the overlay first
      setShowGedachtenOverlay(false);

      const [huidigeVraag, ...rest] = lijstData;
      if (isAntwoordCorrect) {
        // Call the onCorrectAnswer callback
        if (onCorrectAnswer) onCorrectAnswer(); // Handle "leren" mode progression
        if (mode === "leren") {
          const questionKey = getQuestionKey(
            huidigeVraag.vraag,
            huidigeVraag.antwoord
          );
          updateWordStats(questionKey, true, currentLerenMethod);
        }

        // Use setTimeout to ensure state changes don't interfere
        setTimeout(() => {
          if (mode === "leren") {
            // For "leren" mode, move question to end to continue with next step or next question
            const questionKey = getQuestionKey(
              huidigeVraag.vraag,
              huidigeVraag.antwoord
            );
            if (isQuestionCompleteInLeren(questionKey)) {
              // Question completed all steps, remove from list
              const filteredRest = rest.filter((item) => {
                const itemKey = getQuestionKey(item.vraag, item.antwoord);
                return !isQuestionCompleteInLeren(itemKey);
              });

              // Check if this was the last question - if so, mark as completed immediately
              if (filteredRest.length === 0) {
                setListCompleted(true);
              }

              setLijstData(shuffleArray(filteredRest));
            } else {
              // Move question to end to continue with next step
              setLijstData([...rest, huidigeVraag]);
            }
          } else {
            // Check if this was the last question in regular mode
            if (rest.length === 0) {
              setListCompleted(true);
            }
            setLijstData(shuffleArray(rest));
          }
        }, 50); // Short delay
      } else {
        // Call the onWrongAnswer callback
        if (onWrongAnswer) onWrongAnswer();

        // Handle "leren" mode progression (incorrect answer doesn't advance)
        if (mode === "leren") {
          const questionKey = getQuestionKey(
            huidigeVraag.vraag,
            huidigeVraag.antwoord
          );
          updateWordStats(questionKey, false, currentLerenMethod);
        }

        // Use setTimeout to ensure state changes don't interfere
        setTimeout(() => {
          // Move the question to the end
          setLijstData([...rest, huidigeVraag]);
        }, 50); // Short delay
      }
    },
    [
      lijstData,
      shuffleArray,
      onCorrectAnswer,
      onWrongAnswer,
      mode,
      getQuestionKey,
      updateWordStats,
      isQuestionCompleteInLeren,
      currentLerenMethod,
    ]
  );

  const handleAntwoordmultikeuze = useCallback(
    (isAntwoordCorrect: boolean) => {
      if (!lijstData.length || isAnswering || locked) return;
      setIsAnswering(true);

      if (isAntwoordCorrect) {
        setShowCorrect(true);
        if (onCorrectAnswer) onCorrectAnswer();

        // Handle "leren" mode progression      // Handle "leren" mode progression
        if (mode === "leren") {
          const [huidigeVraag] = lijstData;
          const questionKey = getQuestionKey(
            huidigeVraag.vraag,
            huidigeVraag.antwoord
          );
          updateWordStats(questionKey, true, currentLerenMethod);
        }

        // No timeout - let Enter key handle progression
      } else {
        setToonAntwoord(true);
        if (onWrongAnswer) onWrongAnswer();

        // Handle "leren" mode progression (incorrect answer doesn't advance)
        if (mode === "leren") {
          const [huidigeVraag] = lijstData;
          const questionKey = getQuestionKey(
            huidigeVraag.vraag,
            huidigeVraag.antwoord
          );
          updateWordStats(questionKey, false, currentLerenMethod);
        }

        // No timeout - let Enter key handle progression
      }
    },
    [
      lijstData,
      isAnswering,
      onCorrectAnswer,
      onWrongAnswer,
      locked,
      mode,
      getQuestionKey,
      updateWordStats,
      currentLerenMethod,
    ]
  );
  const handleShowGedachtenAnswer = useCallback(() => {
    if (!lijstData.length || locked) return;
    setShowGedachtenOverlay(true);
  }, [lijstData, locked]);

  // Use useMemo for derived calculations
  const getOptionText = useCallback(
    (buttonNumber: number, correctAnswer: string): string => {
      if (randomNumber === buttonNumber) {
        return correctAnswer;
      }

      if (initialMappedData.length < 2) {
        return "Optie";
      }

      // Generate deterministic seed for wrong option selection
      let seed = buttonNumber * 1000; // Base seed on button number
      const str = correctAnswer;
      for (let i = 0; i < str.length; i++) {
        seed = ((seed << 5) - seed + str.charCodeAt(i)) & 0xffffffff;
      }

      let attempts = 0;
      let randomAnswer = "";

      do {
        if (attempts > 10) {
          const randomIndex = Math.floor(
            seededRandom(seed + attempts) * initialMappedData.length
          );
          return initialMappedData[randomIndex]?.antwoord || "Optie";
        }

        attempts++;
        const randomIndex = Math.floor(
          seededRandom(seed + attempts) * initialMappedData.length
        );
        randomAnswer = initialMappedData[randomIndex]?.antwoord || "";
      } while (
        randomAnswer.toLowerCase() === correctAnswer.toLowerCase() ||
        randomAnswer === ""
      );

      return randomAnswer;
    },
    [randomNumber, initialMappedData, seededRandom]
  );

  // Scramble the questions after they have been generated
  useEffect(() => {
    if (initialMappedData.length > 0 && lijstData.length === 0 && !listCompleted) {
      // Only restart if the list hasn't been explicitly completed
      // Additional scramble after initial data processing
      const scrambled = shuffleArray([...initialMappedData]);
      setLijstData(scrambled);
    }
  }, [initialMappedData, lijstData.length, shuffleArray, listCompleted]);

  return (
    <div className="bg-neutral-800 relative min-w-[240px] w-full max-w-[600px] h-[60vh] rounded-lg flex flex-col justify-center overflow-hidden p-4">
      {locked && (
        <div
          className="absolute inset-0 bg-neutral-800 opacity-40 z-40 pointer-events-none"
          aria-hidden="true"
        />
      )}
      {initialMappedData.length === 0 ? (
        <div className={STYLES.centeredText}>Lijst niet gevonden</div>
      ) : (
        mode === "leren"
          ? initialMappedData.every((item) => {
            const questionKey = getQuestionKey(item.vraag, item.antwoord);
            return isQuestionCompleteInLeren(questionKey);
          })
          : lijstData.length === 0
      ) ? (
        <div className="text-center text-white p-4 overflow-y-auto max-h-full">
          <div className="font-bold text-xl mb-2">Gefeliciteerd!</div>
          <div>Je hebt de lijst helemaal af!</div>

          {/* Show streak celebration when list is completed (optimistic) */}
          {listCompleted && (
            <StreakCelebration
              streak={streakInfo.currentStreak}
              isNewStreak={streakInfo.isNewStreak}
            />
          )}

          <div className="space-x-2 mt-4">
            <Button1
              onClick={() => {
                setLijstData(shuffleArray(initialMappedData));
                // Generate new deterministic random number
                setRandomNumber(generateRandomNumber());
                setListCompleted(false);
                setStreakUpdateTriggered(false);
                // Reset "leren" mode state
                setLerenWordStats(new Map());
                setLerenCompleted(new Set());
                setCurrentLerenMethod("multikeuze");
              }}
              text="Opnieuw beginnen"
              className="mt-4"
            />
            <Button1
              redirectTo="/home/start"
              useClNav={true}
              text="Terug naar home"
              className="mt-4"
            />
          </div>
        </div>
      ) : lijstData.length > 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <QuestionDisplay question={lijstData[0]?.vraag || ""} />

          {mode === "toets" && (
            <div className="w-full max-w-md">
              <Input
                ref={toetsInputRef}
                type="text"
                value={userInput}
                onChange={(e) => !locked && setUserInput(e.target.value)}
                placeholder="Type je antwoord hier..."
                className={`w-full ${locked ? "cursor-not-allowed opacity-70" : ""
                  }`}
                disabled={locked}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !locked) {
                    handleAntwoordControleren();
                  }
                }}
              />
              <div className="flex gap-2 mt-4">
                <Button1
                  onClick={!locked ? handleAntwoordControleren : undefined}
                  text="Controleren"
                  className={`flex-1 ${locked ? "opacity-70" : ""}`}
                  disabled={locked}
                />
              </div>
            </div>
          )}

          {mode === "multikeuze" && (
            <div className="grid grid-cols-2 gap-2 w-full max-w-md mt-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-auto min-h-[80px]">
                  <MultiChoiceButton
                    onClick={() =>
                      !locked &&
                      handleAntwoordmultikeuze(randomNumber === index + 1)
                    }
                    isCorrect={randomNumber === index + 1}
                    optionNumber={index + 1}
                    text={getOptionText(
                      index + 1,
                      lijstData[0]?.antwoord || ""
                    )}
                    disabled={isAnswering || locked}
                  />
                </div>
              ))}
            </div>
          )}

          {mode === "gedachten" && (
            <div className="flex gap-2 mt-4 w-full max-w-md">
              <Button1
                onClick={!locked ? handleShowGedachtenAnswer : undefined}
                text="Toon Antwoord"
                className={`flex-1 ${locked ? "opacity-70" : ""}`}
                disabled={locked}
              />
            </div>
          )}

          {mode === "learn" && (
            <div className="flex gap-2 mt-4 w-full max-w-md">
              <Button1
                onClick={!locked ? handleShowGedachtenAnswer : undefined}
                text="Toon Antwoord"
                className={`flex-1 ${locked ? "opacity-70" : ""}`}
                disabled={locked}
              />
            </div>
          )}

          {mode === "hints" && (
            <div className="w-full max-w-md">
              <div className="p-4 bg-neutral-700 rounded-lg text-center mb-4 max-h-[120px] overflow-y-auto">
                <span className="font-extrabold break-words whitespace-pre-wrap">
                  Hint: {getHint(lijstData[0]?.antwoord || "")}
                </span>
              </div>
              <Input
                ref={hintsInputRef}
                type="text"
                value={userInput}
                onChange={(e) => !locked && setUserInput(e.target.value)}
                placeholder="Type je antwoord hier..."
                className={`w-full ${locked ? "cursor-not-allowed opacity-70" : ""
                  }`}
                disabled={locked}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !locked) {
                    handleAntwoordControleren();
                  }
                }}
              />
              <div className="flex gap-2 mt-4">
                <Button1
                  onClick={!locked ? handleAntwoordControleren : undefined}
                  text="Controleren"
                  className={`flex-1 ${locked ? "opacity-70" : ""}`}
                  disabled={locked}
                />
              </div>
            </div>
          )}

          {mode === "leren" && (
            <>
              {currentLerenMethod === "multikeuze" && (
                <div className="grid grid-cols-2 gap-2 w-full max-w-md mt-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-auto min-h-[80px]">
                      <MultiChoiceButton
                        onClick={() =>
                          !locked &&
                          handleAntwoordmultikeuze(randomNumber === index + 1)
                        }
                        isCorrect={randomNumber === index + 1}
                        optionNumber={index + 1}
                        text={getOptionText(
                          index + 1,
                          lijstData[0]?.antwoord || ""
                        )}
                        disabled={isAnswering || locked}
                      />
                    </div>
                  ))}
                </div>
              )}

              {currentLerenMethod === "hints" && (
                <div className="w-full max-w-md">
                  <div className="p-4 bg-neutral-700 rounded-lg text-center mb-4 max-h-[120px] overflow-y-auto">
                    <span className="font-extrabold break-words whitespace-pre-wrap">
                      Hint: {getHint(lijstData[0]?.antwoord || "")}
                    </span>
                  </div>
                  <Input
                    ref={hintsInputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => !locked && setUserInput(e.target.value)}
                    placeholder="Type je antwoord hier..."
                    className={`w-full ${locked ? "cursor-not-allowed opacity-70" : ""
                      }`}
                    disabled={locked}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !locked) {
                        handleAntwoordControleren();
                      }
                    }}
                  />
                  <div className="flex gap-2 mt-4">
                    <Button1
                      onClick={!locked ? handleAntwoordControleren : undefined}
                      text="Controleren"
                      className={`flex-1 ${locked ? "opacity-70" : ""}`}
                      disabled={locked}
                    />
                  </div>
                </div>
              )}

              {currentLerenMethod === "toets" && (
                <div className="w-full max-w-md">
                  <Input
                    ref={toetsInputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => !locked && setUserInput(e.target.value)}
                    placeholder="Type je antwoord hier..."
                    className={`w-full ${locked ? "cursor-not-allowed opacity-70" : ""
                      }`}
                    disabled={locked}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !locked) {
                        handleAntwoordControleren();
                      }
                    }}
                  />
                  <div className="flex gap-2 mt-4">
                    <Button1
                      onClick={!locked ? handleAntwoordControleren : undefined}
                      text="Controleren"
                      className={`flex-1 ${locked ? "opacity-70" : ""}`}
                      disabled={locked}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : null}

      <AnimatePresence>
        {toonAntwoord && (
          <AnswerOverlay correct={false} answer={lijstData[0]?.antwoord} />
        )}
        {showCorrect && <AnswerOverlay correct={true} />}
        {toonTypo && (
          <TypoOverlayComponent
            answer={lijstData[0]?.antwoord || ""}
            submitted={typoSubmitted ?? userInput}
            onGood={handleTypoConfirm}
            onBad={handleTypoReject}
          />
        )}
        {showGedachtenOverlay && lijstData.length > 0 && (
          <GedachtenOverlay
            answer={lijstData[0]?.antwoord || ""}
            onCorrect={() => handleSelfAssessment(true)}
            onIncorrect={() => handleSelfAssessment(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(LearnTool, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.mode === nextProps.mode &&
    prevProps.rawlistdata === nextProps.rawlistdata && // Reference equality check
    prevProps.onCorrectAnswer === nextProps.onCorrectAnswer &&
    prevProps.onWrongAnswer === nextProps.onWrongAnswer &&
    prevProps.onProgressUpdate === nextProps.onProgressUpdate &&
    prevProps.onComplete === nextProps.onComplete
  );
});
