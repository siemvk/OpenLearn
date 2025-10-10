import { redirect } from "next/navigation";
import { prisma } from "@/utils/prisma";
import { Metadata } from "next";
import { getSubjectName } from "@/components/icons";

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
    // This is the default route - redirect to the default tab
    const { id } = await params;

    // Redirect to the default tab route
    redirect(`/learn/viewlist/${id}/woorden`);
}
