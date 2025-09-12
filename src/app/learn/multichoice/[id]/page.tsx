import { addToRecentLists } from "@/utils/actions/updateRecentLists";
import { addToRecentSubjects } from "@/utils/actions/updateRecentSubjects";
import { getListWithPreferences } from "@/serverActions/getListWithPreferences";
import LearnToolWithProgress from "@/components/learning/LearnToolWithProgress";

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // Get list data with user preferences applied
    const result = await getListWithPreferences(id);

    if (!result) {
        return <div>Lijst niet gevonden</div>;
    }

    const { listdata, rawListData, listDataProps, flipQuestionLang } = result;

    // Add this list to user's recent lists
    await addToRecentLists(id);

    // Also add the subject to recent subjects
    if (listdata.subject) {
        await addToRecentSubjects(listdata.subject);
    }

    return (
        <LearnToolWithProgress
            mode="multikeuze"
            rawlistdata={rawListData}
            listId={id}
            currentMethod="multikeuze"
            listData={listDataProps}
            initialFlipQuestionLang={flipQuestionLang}
        />
    );
}
