"use client"
import Button1 from "@/components/button/Button1";
import { List, MousePointerClick } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Import learning method images
import learn from '@/app/img/learn.svg';
import test from '@/app/img/test.svg';
import hints from '@/app/img/hint.svg';
import mind from '@/app/img/mind.svg';

interface WordPair {
    "1": string;
    "2": string;
}

interface ListTableComponentProps {
    wordPairs: WordPair[];
    edit: boolean;
    fromLanguage: string;
    toLanguage: string;
    fromLanguageIcon: StaticImageData | null;
    toLanguageIcon: StaticImageData | null;
    isLanguageSubject: boolean;
    listId: string;
    subject: string;
    listName?: string;
}

export default function ListTableComponent({
    wordPairs,
    fromLanguage,
    toLanguage,
    fromLanguageIcon,
    toLanguageIcon,
    isLanguageSubject,
    listId: _listId,
    subject,
    listName,
}: ListTableComponentProps) {
    const [select, setSelect] = useState<boolean>(false);
    const [selectedPairs, setSelectedPairs] = useState<number[]>([]);

    const router = useRouter();

    const handleCheckboxChange = (pairId: number, isChecked: boolean) => {
        if (isChecked) {
            setSelectedPairs(prev => [...prev, pairId]);
        } else {
            setSelectedPairs(prev => prev.filter(id => id !== pairId));
        }
    };

    const toggleSelect = () => {
        setSelect(!select);
        // Clear selections when turning off select mode
        if (select) {
            setSelectedPairs([]);
        }
    };

    const handleLearn = async (mode: string = 'test') => {
        if (selectedPairs.length === 0) return;

        try {
            // Get the selected word pairs
            const selectedWords = selectedPairs.map(pairId => {
                const pair = wordPairs[pairId];
                return {
                    "1": pair["1"],
                    "2": pair["2"],
                    id: pairId
                };
            });

            // Create a custom session
            const response = await fetch('/api/v1/lists/session/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    words: selectedWords,
                    subject: subject || 'CUSTOM',
                    lang_from: fromLanguage || 'NL',
                    lang_to: toLanguage || 'NL',
                    mode,
                    method: mode === 'leren' ? 'learnlist' : mode,
                    flipQuestionLang: false,
                    name: `Specifieke woorden van ${listName || 'lijst'}`
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create session');
            }

            const data = await response.json();

            // Navigate to the custom session route (method is stored in the session)
            router.push(`/learn/session/${data.sessionId}`);
        } catch (error) {
            console.error('Error creating custom session:', error);
            alert('Er ging iets mis bij het aanmaken van de sessie. Probeer het opnieuw.');
        }
    }

    return (
        <>
            <div className="px-3 pt-1 pb-4 flex flex-row gap-4">
                <Button1
                    text={select ? "Selectie uitzetten" : "Selecteren"}
                    icon={<MousePointerClick />}
                    onClick={toggleSelect}
                />
                {select ? (
                    <div className="flex flex-wrap gap-2">
                        <Button1
                            text="Leren"
                            icon={<Image src={learn} alt="leren" width={16} height={16} />}
                            disabled={!select || selectedPairs.length === 0}
                            onClick={() => handleLearn('leren')}
                            wrapText={false}
                        />
                        <Button1
                            text="Toets"
                            icon={<Image src={test} alt="toets" width={16} height={16} />}
                            disabled={!select || selectedPairs.length === 0}
                            onClick={() => handleLearn('test')}
                            wrapText={false}
                        />
                        <Button1
                            text="Hints"
                            icon={<Image src={hints} alt="hints" width={16} height={16} />}
                            disabled={!select || selectedPairs.length === 0}
                            onClick={() => handleLearn('hints')}
                            wrapText={false}
                        />
                        <Button1
                            text="Gedachten"
                            icon={<Image src={mind} alt="gedachten" width={16} height={16} />}
                            disabled={!select || selectedPairs.length === 0}
                            onClick={() => handleLearn('mind')}
                            wrapText={false}
                        />
                        <Button1
                            text="Meerkeuze"
                            icon={<List width={16} height={16} />}
                            disabled={!select || selectedPairs.length === 0}
                            onClick={() => handleLearn('multichoice')}
                            wrapText={false}
                        />
                    </div>
                ) : null}
            </div>
            <table className="min-w-full divide-y divide-gray-700 rounded-lg overflow-hidden">
                {/* Language header as part of the table */}
                {fromLanguage && toLanguage && (
                    <thead className="bg-neutral-800 border-b border-gray-700">
                        <tr>
                            {select && (
                                <th className="px-6 py-3 w-12">
                                    {/* Empty header for radio button column */}
                                </th>
                            )}
                            <th className={`px-6 py-3 ${select ? 'w-1/2' : 'w-1/2'}`}>
                                <div className="flex items-center justify-center">
                                    {fromLanguageIcon && (
                                        <Image
                                            src={fromLanguageIcon}
                                            alt={`${fromLanguage} icoon`}
                                            width={24}
                                            height={24}
                                            className="mr-2"
                                        />
                                    )}
                                    <span className="text-white text-xl font-bold">
                                        {fromLanguage}
                                    </span>
                                </div>
                            </th>
                            <th className={`px-6 py-3 ${select ? 'w-1/2' : 'w-1/2'}`}>
                                <div className="flex items-center justify-center">
                                    {toLanguageIcon && (
                                        <Image
                                            src={toLanguageIcon}
                                            alt={`${toLanguage} icon`}
                                            width={24}
                                            height={24}
                                            className="mr-2"
                                        />
                                    )}
                                    <span className="text-white text-xl font-bold">
                                        {toLanguage}
                                    </span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                )}
                <thead className="bg-gray-800">
                    <tr>
                        {select && (
                            <th
                                scope="col"
                                className="px-6 py-3 text-center text-xl font-medium text-gray-300 w-12"
                            >
                                Selectie
                            </th>
                        )}
                        <th
                            scope="col"
                            className={`px-6 py-3 text-center text-xl font-medium text-gray-300 ${select ? 'w-1/2' : 'w-1/2'}`}
                        >
                            {isLanguageSubject ? "Origineel" : "Term"}
                        </th>
                        <th
                            scope="col"
                            className={`px-6 py-3 text-center text-xl font-medium text-gray-300 ${select ? 'w-1/2' : 'w-1/2'}`}
                        >
                            {isLanguageSubject ? "Vertaling" : "Definitie"}
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-800">
                    {wordPairs
                        .filter(
                            (pair) => pair["1"] !== "" || pair["2"] !== "" // Only filter out completely empty pairs
                        )
                        .map((pair, index) => {
                            return (
                                <tr
                                    key={index}
                                    className="bg-neutral-800"
                                >
                                    {select && (
                                        <td className="px-6 py-4 text-center">
                                            <div className="relative inline-block">
                                                <input
                                                    type="checkbox"
                                                    id={`checkbox-${index}`}
                                                    name="selectedPairs"
                                                    value={index}
                                                    checked={selectedPairs.includes(index)}
                                                    onChange={(e) => handleCheckboxChange(index, e.target.checked)}
                                                    className="peer sr-only"
                                                />
                                                <label
                                                    htmlFor={`checkbox-${index}`}
                                                    className="block w-6 h-6 bg-gray-100 border-2 border-gray-300 rounded-full cursor-pointer relative transition-all duration-200 hover:border-sky-400 peer-checked:bg-sky-400 peer-checked:border-sky-400"
                                                >
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <svg
                                                            className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={3}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                    </div>
                                                </label>
                                                <style jsx>{`
                                                    input:checked + label svg {
                                                        opacity: 1;
                                                    }
                                                `}</style>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-center font-bold text-xl text-white">
                                        {pair["1"]}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-xl text-white">
                                        {pair["2"]}
                                    </td>
                                </tr>
                            );
                        })}
                </tbody>
            </table>
        </>
    );
}
