import { redirect } from 'next/navigation';

interface PageParams {
    params: Promise<{ id: string }>;
}

export default async function ViewListPage({ params }: PageParams) {
    const { id } = await params;

    // Redirect to the default 'woorden' tab
    redirect(`/learn/viewlist/${id}/woorden`);
}
