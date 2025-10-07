"use client";
import { updateDailyStreak } from '../streak/updateStreak';

function TypfoutScreen({ show, userInput, correctAnswer, onMark, progress, showProgress }: {
  show: boolean;
  userInput: string;
  correctAnswer: string;
  onMark: (correct: boolean) => void;
  progress: number;
  showProgress: boolean;
}) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="absolute inset-0 bg-yellow-500    rounded-lg pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-white z-20 flex-col"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{ pointerEvents: 'auto' }}
          >
            <CircleAlert size={50} />
            <h1 className="text-2xl font-bold mt-2">Je hebt een typfout gemaakt!</h1>
            <div className="mt-4 text-lg">
              <span className="block">Ingevuld: <span className="font-mono bg-neutral-900/60 px-2 py-1 rounded">{userInput}</span></span>
              <span className="block mt-1">Verwacht: <span className="font-mono bg-neutral-900/60 px-2 py-1 rounded">{correctAnswer}</span></span>
            </div>
            <div className="flex gap-4 mt-6">
              <Button1 text="Goed rekenen" onClick={() => onMark(true)} />
              <Button1 text="Fout rekenen" onClick={() => onMark(false)} />
            </div>
          </motion.div>
          {showProgress && (
            <motion.div
              className="absolute bottom-4 left-4 right-4 pointer-events-none z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Progress value={progress} className="h-2" />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
import React, { useState, useEffect } from 'react';
import { useListStore } from './listStore';
import Button1 from '@/components/button/Button1';
import { Input } from '../ui/input';
import { detectTypfout } from './typfout';
import { CircleAlert, CircleCheck, CircleX } from 'lucide-react';
import { Progress } from '../ui/progress';
import { motion, AnimatePresence } from 'motion/react';

function CorrectScreen({ show, progress, showProgress }: {
  show: boolean;
  progress: number;
  showProgress: boolean;
}) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className='absolute inset-0 bg-green-500    rounded-lg pointer-events-none'
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className='absolute inset-0 flex items-center justify-center text-white pointer-events-none z-10 flex-col'
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}

          >
            <CircleCheck size={50} />
            <h1 className='text-2xl font-bold'>Correct!</h1>
          </motion.div>
          {showProgress && (
            <motion.div
              className="absolute bottom-4 left-4 right-4 pointer-events-none z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Progress value={progress} className="h-2" />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}

function IncorrectScreen({ show, correctAnswer, progress, showProgress, setIsCorrect }: {
  show: boolean;
  correctAnswer: string;
  progress: number;
  showProgress: boolean;
  setIsCorrect: (correct: boolean) => void;

}) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className='absolute inset-0 bg-red-500    rounded-lg pointer-events-none'
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className='absolute inset-0 flex items-center justify-center text-white pointer-events-none z-10 flex-col'
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{ pointerEvents: 'auto' }}
          >
            <CircleX size={50} />
            <h1 className='text-2xl font-bold'>Incorrect!</h1>
            <p className="mt-2 text-lg">
              Het juiste antwoord is: <strong>{correctAnswer}</strong>
            </p>
            <div className="flex gap-4 mt-6">
              <Button1 text="Goed rekenen" onClick={() => setIsCorrect(true)} />
            </div>

          </motion.div>
          {showProgress && (
            <motion.div
              className="absolute bottom-4 left-4 right-4 pointer-events-none z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Progress value={progress} className="h-2" />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}

function BlueReview({ show, answer, onMark }: {
  show: boolean;
  answer: string;
  onMark: (correct: boolean) => void;
  progress?: number;
  showProgress?: boolean;
}) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            // background overlay - positioned under the content
            className='absolute inset-0 bg-blue-500 rounded-lg pointer-events-none z-10'
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            // content container - allow pointer events so buttons are clickable
            className='absolute inset-0 flex items-center justify-center text-white z-20 flex-col'
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{ pointerEvents: 'auto' }}
          >
            <h1 className='text-xl font-bold'>Het antwoord is: </h1>
            <h1 className='text-2xl font-bold'>{answer}</h1>
            <h1 className='text-xl font-bold'>Had je het goed?</h1>
            <div className='flex flex-row gap-4 mt-2'>
              <Button1 text="Ja" onClick={() => onMark(true)} />
              <Button1 text="Nee" onClick={() => onMark(false)} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Function to generate hint from answer
function generateHint(answer: string): string {
  if (!answer) return '';

  const words = answer.split(' ');
  return words.map(word => {
    if (word.length <= 2) {
      return word; // Keep short words intact
    }

    // For longer words, show first letter and underscores for the rest
    const firstChar = word[0];
    const underscores = '_'.repeat(word.length - 1);
    return firstChar + underscores;
  }).join(' ');
}

export default function LearnTool() {
  const {
    currentList,
    currentWord,
    currentMethod,
    setRandomCurrentWord,
    checkAnswer,
    answerCorrect,
    answerWrong,
  } = useListStore();

  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isTypfout, setIsTypfout] = useState(false);
  const [showTypfout, setShowTypfout] = useState(false);
  const [streakUpdate, setStreakUpdate] = useState<{ success?: boolean; streakUpdated?: boolean; currentStreak?: number } | null>(null);
  const [progress, setProgress] = useState(100);
  const [isTimerActive, setIsTimerActive] = useState(false);
  // For multiple choice: options are provided server-side on the currentWord as `options`.
  const mcOptions = (currentMethod === 'multichoice' && currentWord && Array.isArray((currentWord as any).options))
    ? (currentWord as any).options as string[]
    : [];
  // Mind mode state: show blue review overlay
  const [showBlueReview, setShowBlueReview] = useState(false);

  // Timer for overlay visibility (both correct and incorrect)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && showResult) {
      const duration = isCorrect ? 1000 : 3000; // 1.5s for correct, 3s for incorrect
      const intervalTime = 50; // Update every 50ms for smooth animation
      let timeLeft = duration;

      interval = setInterval(() => {
        timeLeft -= intervalTime;
        const progressValue = (timeLeft / duration) * 100;
        setProgress(Math.max(0, progressValue));

        if (timeLeft <= 0) {
          handleNext();
        }
      }, intervalTime);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, showResult, isCorrect]);

  // regel de streak update
  useEffect(() => {
    async function fetchStreakUpdate() {
      const result = await updateDailyStreak();
      console.log('Streak update result:', JSON.stringify(result));
      setStreakUpdate(result);
    }
    fetchStreakUpdate();
  }, []);

  // Global handler: when an overlay is visible (result screens), allow Enter to advance
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;

      // if an input or textarea is focused, don't hijack Enter (let onKeyPress handle it)
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

      // if typfout overlay is visible, we don't advance here (user should choose Good/Wrong)
      if (showTypfout) return;

      if (showResult) {
        handleNext();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showResult, showTypfout]);

  const handleSubmit = () => {
    if (!currentWord || !userInput.trim()) return;
    const answer = currentWord["2"] || '';
    const correct = checkAnswer(userInput);
    const typfout = !correct && detectTypfout(userInput, answer);
    setIsCorrect(correct);
    setIsTypfout(typfout);
    if (typfout) {
      setShowTypfout(true);
      setShowResult(false);
      setIsTimerActive(false);
      return;
    }
    setShowResult(true);
    if (correct) {
      answerCorrect();
      setProgress(100);
      setIsTimerActive(true);
    } else {
      answerWrong(userInput);
      setProgress(100);
      setIsTimerActive(true);
    }
  };
  // Handler voor typfout popup
  const handleTypfoutMark = (wasCorrect: boolean) => {
    setIsCorrect(wasCorrect);
    // reset typfout flag so the normal correct/incorrect overlays show
    setIsTypfout(false);
    setShowTypfout(false);
    setShowResult(true);
    setIsTimerActive(true);
    if (wasCorrect) {
      answerCorrect();
    } else {
      answerWrong(userInput);
    }
    setProgress(100);
  };

  // Handler for mind mode 'Controleer' button
  const handleMindCheck = () => {
    if (!currentWord) return;
    setShowBlueReview(true);
  };

  const handleMindMark = (wasCorrect: boolean) => {
    // Record the user's self-mark and immediately advance to next word
    setIsCorrect(wasCorrect);
    if (wasCorrect) {
      answerCorrect();
    } else {
      // mark wrong; pass empty input (user didn't type an answer)
      answerWrong('');
    }

    // Reset UI state and move to the next word immediately
    setShowBlueReview(false);
    setUserInput('');
    setShowResult(false);
    setIsTimerActive(false);
    setProgress(100);
    setRandomCurrentWord();
  };

  // For multiple choice, handle clicking an option
  const handleMcClick = (option: string) => {
    if (showResult) return;
    setUserInput(option);
    const correct = checkAnswer(option);
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      answerCorrect();
      setProgress(100);
      setIsTimerActive(true);
    } else {
      answerWrong(option);
      setProgress(100);
      setIsTimerActive(true);
    }
  };

  const handleNext = () => {
    setUserInput('');
    setShowResult(false);
    setIsTimerActive(false);
    setProgress(100);
    // hide blue review overlay when moving to the next word
    setShowBlueReview(false);
    setRandomCurrentWord();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showResult) {
      handleSubmit();
    } else if (e.key === 'Enter' && showResult) {
      handleNext();
    }
  };
  const displayWord = currentWord;


  if ((!currentList || !currentList.data?.length) && !showResult) {

    return (
      <div className="bg-neutral-800 rounded-lg p-8 w-full max-w-md mx-auto text-white text-center">
        {currentList && currentList.data?.length === 0 ? (
          <>
            <h2 className="text-2xl font-bold mb-2">Einde van de lijst!</h2>
            {streakUpdate?.success && streakUpdate?.streakUpdated ? (
              <p className="text-lg text-neutral-300">
                Je huidige streak is nu <strong>{streakUpdate.currentStreak}</strong> dagen!
              </p>
            ) : null}
            <p className="text-lg text-neutral-300">Je hebt alle woorden geoefend. Goed gedaan!</p>
          </>
        ) : (
          <p>Er is iets misgegaan bij het laden van de lijst.</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 rounded-lg p-8 w-full max-w-md mx-auto text-white relative">
      <div className="space-y-6">
        {/* Render based on current method */}
        {currentMethod === 'test' ? (
          <>
            <div className="text-center">
              <div className="text-2xl font-bold mb-4">
                {displayWord?.["1"]}
              </div>
            </div>
            <hr className="border-neutral-600" />
            <div className="space-y-4">
              <Input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Typ je antwoord..."
                className="w-full bg-neutral-700 text-white h-13 rounded-lg text-center text-lg"
              />

              <div className="text-center">
                {!showResult ? (
                  <Button1
                    text="Controleer"
                    onClick={handleSubmit}
                  />
                ) : (
                  <Button1
                    text="Volgende"
                    onClick={handleNext}
                  />
                )}
              </div>
            </div>
          </>
        ) : currentMethod === 'hints' ? (
          <>
            <div className="text-center">
              <div className="text-2xl font-bold mb-4">
                {displayWord?.["1"]}
              </div>
            </div>
            <hr className="border-neutral-600" />
            <div className="space-y-4">
              {/* Hint display */}
              <div className="text-center">
                <p className="text-sm text-neutral-400 mb-2">Hint:</p>
                <p className="text-lg font-mono text-blue-300 bg-blue-900/20 px-3 py-2 rounded border border-blue-500/30">
                  {generateHint(currentWord?.["2"] || "")}
                </p>
              </div>

              <Input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Typ je antwoord..."
                className="w-full bg-neutral-700 text-white h-13 rounded-lg text-center text-lg"
              />

              <div className="text-center">
                {!showResult ? (
                  <Button1
                    text="Controleer"
                    onClick={handleSubmit}
                  />
                ) : (
                  <Button1
                    text="Volgende"
                    onClick={handleNext}
                  />
                )}
              </div>
            </div>
          </>
        ) : currentMethod === 'multichoice' ? (
          <>
            <div className="text-center">
              <div className="text-2xl font-bold mb-4">
                {displayWord?.["1"]}
              </div>
            </div>
            <hr className="border-neutral-600" />
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                {mcOptions.map((option) => (
                  <Button1
                    key={option}
                    text={option}
                    onClick={() => handleMcClick(option)}
                    disabled={showResult}
                  />
                ))}
              </div>
            </div>
          </>
        ) : currentMethod === 'mind' ? (
          <>
            <div className="text-center">
              <div className="text-2xl font-bold mb-4">
                {displayWord?.["1"]}
              </div>
            </div>
            <hr className="border-neutral-600 mb-4" />
            <div className="text-center">
              <Button1 text="Controleer" onClick={handleMindCheck} />
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-2xl font-bold mb-4">
              {displayWord?.["1"]}
            </div>
            <hr className="border-neutral-600 mb-4" />
            <div className="text-lg text-neutral-300 mb-4">
              {displayWord?.["2"]}
            </div>
            <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-300 font-medium">
                {currentMethod === 'learnlist' && 'LearnList Modus'}
                {!['learnlist', 'multichoice', 'mind'].includes(currentMethod || '') && `${currentMethod} Modus`}
              </p>
              <p className="text-sm text-neutral-400 mt-2">
                Deze modus wordt binnenkort geïmplementeerd
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Overlay screens - show for test, hints, and multichoice modes */}
      {(currentMethod === 'test' || currentMethod === 'hints' || currentMethod === 'multichoice') && (
        <>
          <CorrectScreen
            show={showResult && isCorrect}
            progress={progress}
            showProgress={isTimerActive}
          />
          <IncorrectScreen
            show={showResult && !isCorrect && !isTypfout}
            correctAnswer={currentWord?.["2"] || ""}
            progress={progress}
            showProgress={isTimerActive}
            setIsCorrect={handleTypfoutMark}
          />
          <TypfoutScreen
            show={showTypfout}
            userInput={userInput}
            correctAnswer={currentWord?.["2"] || ''}
            onMark={handleTypfoutMark}
            progress={progress}
            showProgress={false}
          />
        </>
      )}
      {currentMethod === 'mind' && (
        <BlueReview
          show={showBlueReview}
          answer={displayWord?.["2"] || ''}
          onMark={handleMindMark}
          progress={progress}
          showProgress={isTimerActive}
        />
      )}
    </div>
  );
}