"use client";

import { useState, useCallback, memo, useEffect } from 'react';
import LearnTool from './learnTool';
import LearnToolHeader from '../navbar/learntToolHeader';

interface LearnToolWithProgressProps {
    mode: "toets" | "gedachten" | "hints" | "learn" | "multikeuze" | "leren";
    rawlistdata: any[];
    listId: string;
    currentMethod?: string;  // Make currentMethod optional
    onComplete?: () => void;
    listData?: {
        lang_from?: string | null;
        lang_to?: string | null;
    };
    initialFlipQuestionLang?: boolean; // Add initial flip state for SSR
}

export default memo(function LearnToolWithProgress({
    mode,
    rawlistdata,
    listId,
    currentMethod,
    onComplete,
    listData: passedListData,
    initialFlipQuestionLang
}: LearnToolWithProgressProps) {
    const [progress, setProgress] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [wrongAnswers, setWrongAnswers] = useState(0);
    // Since data is already transformed server-side, we don't need to apply flip here
    // But we still track the flip state for the settings dialog
    const [flipQuestionLang, setFlipQuestionLang] = useState(initialFlipQuestionLang || false);

    // Extract the actual list ID (remove custom- prefix if present)
    const actualListId = listId.startsWith('custom-') ? listId.replace('custom-', '') : listId;

    // Use passed listData directly since it's already processed server-side
    const listData = passedListData || (rawlistdata.length > 0 ? {
        lang_from: rawlistdata[0]?.lang_from,
        lang_to: rawlistdata[0]?.lang_to,
    } : null);

    const handleCorrectAnswer = useCallback(() => {
        setCorrectAnswers(prev => prev + 1);
    }, []);

    const handleWrongAnswer = useCallback(() => {
        setWrongAnswers(prev => prev + 1);
    }, []);

    const handleProgressUpdate = useCallback((completed: number, total: number) => {
        const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        setProgress(progressPercentage);
    }, []);

    // Handle completion - always provide a callback to LearnTool
    const handleFlipQuestionLangChange = useCallback((flipped: boolean) => {
        setFlipQuestionLang(flipped);
    }, []);

    // Handle completion - always provide a callback to LearnTool
    const handleCompletion = useCallback(() => {
        // Call the external onComplete callback if provided
        if (onComplete) {
            onComplete();
        }
        // If no external callback, that's fine - LearnTool will handle streak updates internally
    }, [onComplete]);

    return (
        <div className="min-h-screen flex flex-col">
            <LearnToolHeader
                listId={listId}
                progress={progress}
                correctAnswers={correctAnswers}
                wrongAnswers={wrongAnswers}
                currentMethod={currentMethod}
                listData={listData}
                onFlipQuestionLangChange={handleFlipQuestionLangChange}
                initialFlipQuestionLang={initialFlipQuestionLang}
            />

            {/* Ensure this container allows LearnTool to grow */}
            <div className="flex-grow flex items-center justify-center py-8"> {/* Added padding */}
                <LearnTool
                    mode={mode}
                    rawlistdata={rawlistdata}
                    onCorrectAnswer={handleCorrectAnswer}
                    onWrongAnswer={handleWrongAnswer}
                    onProgressUpdate={handleProgressUpdate}
                    onComplete={handleCompletion}
                    flipQuestionLang={flipQuestionLang}
                />
            </div>
        </div>
    );
});
