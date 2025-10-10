

import { getSummaryById } from "@/serverActions/summaryActions";
import EditSummaryClient from "./EditSummaryClient";
import { notFound, redirect } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    if (!id) {
        redirect("/home/start");
    }

    const summary = await getSummaryById(id);

    if (!summary || "error" in summary) {
        // Optionally show a not found page or redirect
        notFound();
    }

    return (
        <EditSummaryClient
            summaryId={summary.id || ""}
            initialName={summary.name || ""}
            initialContent={summary.summaryContent || ""}
            initialSubjectId={summary.subject || undefined}
            initialPublished={!!summary.published}
            initialLastSaved={summary.lastSaved ? String(summary.lastSaved) : null}
            creatorId={summary.creator}
        />
    );
}