"use client";

import { memo, useMemo, useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { X, ArrowLeft, Check, X as XIcon, Settings } from "lucide-react";
import Link from "next/link";
import Dropdown from "@/components/button/DropdownBtn";
import Image from "next/image";
import Timer from "./Timer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getSubjectName, getSubjectIcon, isLanguageSubject } from "@/components/icons";
import { useListStore } from "@/components/learning/listStore";

// Import the images for the learning methods
import learn from "@/app/img/learn.svg";
import test from "@/app/img/test.svg";
import hints from "@/app/img/hint.svg";
import mind from "@/app/img/mind.svg";
import livequiz from "@/app/img/livequiz.svg";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../ui/dialog";
import Button1 from "@/components/button/Button1";

// Memoized sub-components to prevent unnecessary re-renders
const BackButton = memo(({ url }: { url: string }) => (
    <Link
        href={url}
        className="flex items-center bg-neutral-700 hover:bg-neutral-600 transition-colors px-3 py-1 rounded-md"
    >
        <ArrowLeft className="h-4 w-4 mr-2" />
        <span>Terug</span>
    </Link>
));
BackButton.displayName = "BackButton";

const ProgressBar = memo(({ progress }: { progress: number }) => (
    <div className="flex-grow mr-4">
        <Progress value={progress} className="h-3 [&>div]:bg-sky-400" />
    </div>
));
ProgressBar.displayName = "ProgressBar";

const StatsCounter = memo(({ count, isCorrect }: { count: number; isCorrect: boolean }) => (
    <span className={`flex items-center px-2 py-1 rounded-md ${isCorrect ? 'text-green-500 bg-green-900/30' : 'text-red-500 bg-red-900/30'
        }`}>
        {isCorrect ? <Check className="h-5 w-5 mr-1" /> : <XIcon className="h-5 w-5 mr-1" />}
        {count}
    </span>
));
StatsCounter.displayName = "StatsCounter";

const StatsDisplay = memo(({ correctAnswers, wrongAnswers }: { correctAnswers: number; wrongAnswers: number }) => (
    <div className="flex items-center gap-3">
        <StatsCounter count={correctAnswers} isCorrect={true} />
        <StatsCounter count={wrongAnswers} isCorrect={false} />
    </div>
));
StatsDisplay.displayName = "StatsDisplay";

const SettingsButton = memo(({ onFlipQuestionLangChange }: {
    onFlipQuestionLangChange?: (flipped: boolean) => void;
}) => {
    const { currentList, flipQuestionLang } = useListStore();
    const [loading, setLoading] = useState(false);
    const [tempFlipQuestionLang, setTempFlipQuestionLang] = useState(flipQuestionLang);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Sync temp state when store state changes
    useEffect(() => {
        setTempFlipQuestionLang(flipQuestionLang);
    }, [flipQuestionLang]);

    // Get list ID from the store
    const listId = currentList?.list_id || '';

    // Extract the actual list ID (remove custom- prefix if present)
    const actualListId = listId.startsWith('custom-') ? listId.replace('custom-', '') : listId;

    // Get language info from the store
    const langFromCode = currentList?.lang_from;
    const langToCode = currentList?.lang_to;
    const langFrom = langFromCode ? getSubjectName(langFromCode) : 'Onbekende taal';
    const langTo = langToCode ? getSubjectName(langToCode) : 'Onbekende taal';
    const langFromIcon = langFromCode ? getSubjectIcon(langFromCode) : null;
    const langToIcon = langToCode ? getSubjectIcon(langToCode) : null;

    // Check if this is a language subject based on the actual subject, not lang_from
    const subjectCode = currentList?.subject;
    const isLanguage = subjectCode ? isLanguageSubject(subjectCode) : false;

    // Preferences are now loaded server-side, no need for client-side request

    const handleTempFlipToggle = (checked: boolean) => {
        // Don't allow changes for combined lists
        if (actualListId.startsWith('combined-')) {
            return;
        }
        setTempFlipQuestionLang(checked);
    };

    const handleSaveAndRestart = async () => {
        // Don't allow changes for combined lists
        if (actualListId.startsWith('combined-')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/v1/lists/${actualListId}/prefs`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    flipQuestionLang: tempFlipQuestionLang
                })
            });

            if (response.ok) {
                // Notify parent component of the change
                if (onFlipQuestionLangChange) {
                    onFlipQuestionLangChange(tempFlipQuestionLang);
                }
                setDialogOpen(false);

                // Restart the current page by reloading
                window.location.reload();
            } else {
                console.error('Failed to save preference');
            }
        } catch (error) {
            console.error('Error saving preference:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDialogOpenChange = (open: boolean) => {
        setDialogOpen(open);
        if (open) {
            // Reset temp state to current store state when opening
            setTempFlipQuestionLang(flipQuestionLang);
        }
    };

    const isCombinedList = actualListId.startsWith('combined-');

    return (
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
                <button
                    className="flex items-center justify-center h-8 w-8 bg-neutral-700 hover:bg-neutral-600 transition-colors rounded-full"
                >
                    <Settings className="h-4 w-4" />
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogTitle>Leerinstellingen</DialogTitle>
                <div className="space-y-6 p-4">
                    <div className="space-y-3">
                        <Label htmlFor="flip-lang" className="text-sm font-medium">
                            {isLanguage ? 'Vraag taal' : 'Vraag om'}
                        </Label>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Switch
                                    id="flip-lang"
                                    checked={tempFlipQuestionLang}
                                    onCheckedChange={handleTempFlipToggle}
                                    disabled={loading || isCombinedList}
                                />
                                <span className="text-sm text-neutral-400 flex items-center gap-2">
                                    {isLanguage ? (
                                        // For language subjects, show language icons and names
                                        tempFlipQuestionLang ? (
                                            <>
                                                {langToIcon && (
                                                    <Image src={langToIcon} alt={langTo} width={16} height={16} className="rounded-sm" />
                                                )}
                                                {langTo}
                                            </>
                                        ) : (
                                            <>
                                                {langFromIcon && (
                                                    <Image src={langFromIcon} alt={langFrom} width={16} height={16} className="rounded-sm" />
                                                )}
                                                {langFrom}
                                            </>
                                        )
                                    ) : (
                                        tempFlipQuestionLang ? 'Definitie' : 'Begrip'
                                    )}
                                </span>
                            </div>
                        </div>
                        {isCombinedList && (
                            <p className="text-xs text-neutral-500">
                                {isLanguage ? 'Taal omwisselen' : 'Vraag type omwisselen'} is niet beschikbaar voor gecombineerde lijsten.
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end p-4 border-t border-neutral-700">
                        <Button1
                            text={loading ? 'Opslaan...' : 'Opslaan en opnieuw beginnen'}
                            onClick={handleSaveAndRestart}
                            disabled={loading || isCombinedList || tempFlipQuestionLang === flipQuestionLang}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
});
SettingsButton.displayName = "SettingsButton";

const ExitButton = memo(() => (
    <Link
        href="/home/start"
        className="flex items-center justify-center h-8 w-8 bg-neutral-700 hover:bg-neutral-600 transition-colors rounded-full"
    >
        <X className="h-5 w-5" />
    </Link>
));
ExitButton.displayName = "ExitButton";

const MethodDropdown = memo(({
    currentMethod,
    learningMethods
}: {
    currentMethod: string;
    learningMethods: [React.ReactNode, string][]
}) => {
    const getMethodDisplayText = () => {
        switch (currentMethod) {
            case "toets":
                return "Toets";
            case "hints":
                return "Hints";
            case "gedachten":
                return "In gedachten";
            case "multikeuze":
                return "Meerkeuze";
            default:
                return "Leren";
        }
    };

    return (
        <div className="learn-dropdown hidden md:block w-45 mx-5">
            <Dropdown
                text={getMethodDisplayText()}
                dropdownMatrix={learningMethods}
                width={180}
            />
        </div>
    );
});
MethodDropdown.displayName = "MethodDropdown";

interface LearnToolHeaderProps {
    progress?: number; // 0-100
    onMethodChange?: (method: string) => void;
    onFlipQuestionLangChange?: (flipped: boolean) => void; // Add callback for flip changes
}

const HeaderLearnTool = memo(({
    progress: externalProgress,
    onMethodChange,
    onFlipQuestionLangChange,
}: LearnToolHeaderProps) => {
    // Get stats and list info from the store
    const { score, currentList, answerLog, currentMethod, originalWordCount, flipQuestionLang } = useListStore();
    const correctAnswers = score.correct;
    const wrongAnswers = score.wrong;

    // Get list ID from the store
    const listId = currentList?.list_id || '';

    // Calculate progress based on store data if no external progress provided
    const progress = externalProgress ?? (() => {
        if (!originalWordCount || originalWordCount === 0) return 0;
        // Progress is based on words completed (removed from list) vs total original words
        const wordsCompleted = originalWordCount - (currentList?.data.length || 0);
        return Math.min((wordsCompleted / originalWordCount) * 100, 100);
    })();
    // Check if this is a custom learning session
    const isCustomMode = listId.startsWith('custom-');
    const actualListId = isCustomMode ? listId.replace('custom-', '') : listId;

    // Check if this is a combined list (multiple lists selected)
    const isCombinedList = actualListId.startsWith('combined-');

    // Determine the back button URL
    const backButtonUrl = isCombinedList ? '/home/start' : `/learn/viewlist/${actualListId}`;

    // Memoize the learning methods to prevent unnecessary re-renders
    const learningMethods = useMemo((): [React.ReactNode, string][] => [
        [
            <div key="leren" className="flex items-center">
                <Image
                    src={learn}
                    alt="leren plaatje"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                <span className="font-medium">Leren</span>
            </div>,
            isCustomMode ? `/learn/custom/learn` : `/learn/learnlist/${listId}`,
        ],
        [
            <div key="toets" className="flex items-center">
                <Image
                    src={test}
                    alt="toets plaatje"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                <span className="font-medium">Toets</span>
            </div>,
            isCustomMode ? `/learn/custom/test` : `/learn/test/${listId}`,
        ],
        [
            <div key="hints" className="flex items-center">
                <Image
                    src={hints}
                    alt="hints plaatje"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                <span className="font-medium">Hints</span>
            </div>,
            isCustomMode ? `/learn/custom/hints` : `/learn/hints/${listId}`,
        ],
        [
            <div key="gedachten" className="flex items-center">
                <Image
                    src={mind}
                    alt="gedachten plaatje"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                <span className="font-medium">In gedachten</span>
            </div>,
            isCustomMode ? `/learn/custom/mind` : `/learn/mind/${listId}`,
        ],
        [
            <div key="multikeuze" className="flex items-center">
                <Image
                    src={livequiz}
                    alt="Multikeuze plaatje"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                <span className="font-medium">Multikeuze</span>
            </div>,
            isCustomMode ? `/learn/custom/multichoice` : `/learn/multichoice/${listId}`,
        ],
    ], [isCustomMode, listId]);

    return (
        <>
            <div className="w-full bg-neutral-800 p-3 flex items-center justify-between sticky top-0 z-100 border-b border-neutral-700">
                {/* Left side: Back button and timer */}
                <div className="flex items-center gap-3">
                    <BackButton url={backButtonUrl} />
                    <Timer />
                </div>

                {/* Method dropdown */}
                <MethodDropdown currentMethod={currentMethod || "learnlist"} learningMethods={learningMethods} />

                {/* Progress bar */}
                <ProgressBar progress={progress} />

                {/* Right side: Settings, stats, and exit */}
                <div className="flex items-center gap-4">
                    <SettingsButton
                        onFlipQuestionLangChange={onFlipQuestionLangChange}
                    />
                    <StatsDisplay correctAnswers={correctAnswers} wrongAnswers={wrongAnswers} />
                    <ExitButton />
                </div>
            </div>

            <style>{`
        .learn-dropdown > div.absolute {
          position: fixed !important;
          left: 200px !important;
          top: 3px !important;
          z-index: 150;
        }
      `}</style>
        </>
    );
});
HeaderLearnTool.displayName = "HeaderLearnTool";

export default HeaderLearnTool;
