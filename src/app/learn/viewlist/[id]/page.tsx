import { prisma } from "@/utils/prisma"
import { getSubjectIcon, getSubjectName } from "@/components/icons";
import { Metadata } from "next";

import ListTableComponent from "./listTableComponent";

interface WordPair {
    "1": string;  // term
    "2": string;  // definition
}

// Helper function to validate if an object is a WordPair
function isWordPair(obj: any): obj is WordPair {
    return (
        obj !== null &&
        typeof obj === 'object' &&
        typeof obj["1"] === 'string' &&
        typeof obj["2"] === 'string'
    );
}

// Helper function to check if array contains WordPair objects
function isWordPairArray(arr: any[]): arr is WordPair[] {
    return arr.every(item => isWordPair(item));
}

interface PageParams {
    params: Promise<{
        id: string;
    }>;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;

    try {
        const listData = await prisma.practice.findFirst({
            where: {
                list_id: id
            },
            select: {
                name: true,
                subject: true,
                lang_from: true,
                lang_to: true,
                data: true,
                creator: true
            }
        });

        if (!listData) {
            return {
                title: "Lijst niet gevonden | PolarLearn",
                description: "De gevraagde woordenlijst kon niet worden gevonden.",
            };
        }

        // Get subject name for better display
        const subjectName = listData.subject ? getSubjectName(listData.subject) : '';

        // Count words in the list
        let wordCount = 0;
        if (listData.data) {
            try {
                let parsedData: any;
                if (typeof listData.data === 'string') {
                    parsedData = JSON.parse(listData.data);
                } else {
                    parsedData = listData.data;
                }
                if (Array.isArray(parsedData)) {
                    wordCount = parsedData.length;
                }
            } catch (error) {
                console.log("Error parsing list data for metadata:", error);
                wordCount = 0;
            }
        }

        // Create a descriptive title
        let title = listData.name;
        if (subjectName) {
            title += ` | ${subjectName}`;
        }
        title += " | PolarLearn";

        // Create description with word count and subject info
        let description = `Oefen met deze woordenlijst "${listData.name}"`;
        if (wordCount > 0) {
            description += ` met ${wordCount} ${wordCount === 1 ? 'woord' : 'woorden'}`;
        }
        if (listData.lang_from && listData.lang_to) {
            const fromLang = getSubjectName(listData.lang_from);
            const toLang = getSubjectName(listData.lang_to);
            if (fromLang && toLang) {
                description += ` (${fromLang} → ${toLang})`;
            }
        }
        description += " op PolarLearn";

        return {
            title,
            description: description.substring(0, 160), // Limit for SEO
        };
    } catch (error) {
        console.error("Error generating metadata:", error);
        return {
            title: "PolarLearn Woordenlijsten",
            description: "Oefen met woordenlijsten en verbeter je kennis op PolarLearn",
        };
    }
}

export default async function ViewListPage({ params }: PageParams) {
    // This is the default route - just render the word list content
    const { id } = await params;
    const listData = await prisma.practice.findFirst({
        where: {
            list_id: id
        },
        select: {
            list_id: true,
            name: true,
            createdAt: true,
            creator: true,
            data: true,
            subject: true,
            lang_from: true,
            lang_to: true,
            published: true,
            updatedAt: true
        }
    });

    // Use the top-level subject field from the practice model
    const subject = listData?.subject || 'general';

    // Check if the subject is a language
    const isLanguageSubject = ['NL', 'EN', 'FR', 'DE'].includes(subject.toUpperCase());

    // From and To language info
    const fromLanguage = listData?.lang_from ? getSubjectName(listData.lang_from) : '';
    const toLanguage = listData?.lang_to ? getSubjectName(listData.lang_to) : '';

    // Get language icons
    const fromLanguageIcon = listData?.lang_from ? getSubjectIcon(listData.lang_from) : null;
    const toLanguageIcon = listData?.lang_to ? getSubjectIcon(listData.lang_to) : null;

    // Handle the word pairs data - could be already an object or a JSON string
    let wordPairs: WordPair[] = [];
    if (listData?.data) {
        try {
            let parsedData: any;

            // Check if data is already an object or needs parsing
            if (typeof listData.data === 'string') {
                parsedData = JSON.parse(listData.data);
            } else {
                parsedData = listData.data;
            }

            // Verify the data is an array
            if (Array.isArray(parsedData)) {
                // Type check the array elements
                if (isWordPairArray(parsedData)) {
                    wordPairs = parsedData;
                } else {
                    wordPairs = parsedData.filter(isWordPair);
                }
            }
        } catch (error) {
            console.error("Error processing data:", error, "Raw data:", listData.data);
        }
    }

    return (
        <div>
            {wordPairs.length > 0 ? (
                <div className="overflow-x-auto">
                    <ListTableComponent
                        wordPairs={wordPairs}
                        edit={false}
                        fromLanguage={fromLanguage}
                        toLanguage={toLanguage}
                        fromLanguageIcon={fromLanguageIcon}
                        toLanguageIcon={toLanguageIcon}
                        isLanguageSubject={isLanguageSubject}
                        listId={id}
                    />
                </div>
            ) : (
                <p className="text-gray-500 text-center">
                    Geen woorden gevonden in deze lijst :(
                </p>
            )}
        </div>
    )
}